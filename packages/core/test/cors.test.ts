// CORS — credentialed cross-origin must reflect an allowlisted origin exactly,
// never "*" with credentials, and always Vary: Origin.
import { describe, it, expect } from 'vitest';
import { corsHeaders, originAllowed, isPreflight, corsFromEnv } from '../src/index.ts';

const cfg = { origins: ['https://app.example.com'], credentials: true };

describe('originAllowed', () => {
  it('allows an exact match', () => {
    expect(originAllowed('https://app.example.com', cfg)).toBe(true);
  });
  it('rejects an unknown origin', () => {
    expect(originAllowed('https://evil.com', cfg)).toBe(false);
  });
  it('rejects null/empty', () => {
    expect(originAllowed(null, cfg)).toBe(false);
    expect(originAllowed(undefined, cfg)).toBe(false);
  });
  it('"*" only reflects any origin WITHOUT credentials', () => {
    expect(originAllowed('https://x.com', { origins: ['*'], credentials: true })).toBe(false);
    expect(originAllowed('https://x.com', { origins: ['*'], credentials: false })).toBe(true);
  });
});

describe('corsHeaders', () => {
  it('echoes the concrete origin with credentials (never "*")', () => {
    const h = corsHeaders('https://app.example.com', cfg);
    expect(h['access-control-allow-origin']).toBe('https://app.example.com');
    expect(h['access-control-allow-credentials']).toBe('true');
    expect(h['vary']).toBe('Origin');
  });
  it('returns only Vary for a disallowed origin (browser blocks the read)', () => {
    const h = corsHeaders('https://evil.com', cfg);
    expect(h['access-control-allow-origin']).toBeUndefined();
    expect(h['vary']).toBe('Origin');
  });
  it('uses literal "*" only for non-credentialed wildcard', () => {
    const h = corsHeaders('https://x.com', { origins: ['*'], credentials: false });
    expect(h['access-control-allow-origin']).toBe('*');
    expect(h['access-control-allow-credentials']).toBeUndefined();
  });
});

describe('isPreflight', () => {
  it('detects an OPTIONS preflight', () => {
    expect(isPreflight('OPTIONS', 'POST')).toBe(true);
    expect(isPreflight('OPTIONS', null)).toBe(false);
    expect(isPreflight('POST', 'POST')).toBe(false);
  });
});

describe('corsFromEnv', () => {
  it('parses a comma list and the credentials flag', () => {
    process.env.PLANETLOGIN_CORS_ORIGINS = 'https://a.com, https://b.com';
    process.env.PLANETLOGIN_CORS_CREDENTIALS = 'false';
    const c = corsFromEnv();
    expect(c.origins).toEqual(['https://a.com', 'https://b.com']);
    expect(c.credentials).toBe(false);
    delete process.env.PLANETLOGIN_CORS_ORIGINS;
    delete process.env.PLANETLOGIN_CORS_CREDENTIALS;
  });
});

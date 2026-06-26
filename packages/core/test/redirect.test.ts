// Open-redirect defense — regression guard for the bypasses that bit the WIP.
import { describe, it, expect } from 'vitest';
import { safeReturnPath } from '../src/redirect.ts';

const SELF = 'https://auth.calcat.app';

describe('safeReturnPath', () => {
  it('keeps a normal same-origin path', () => {
    expect(safeReturnPath('/dashboard?x=1#h', SELF)).toBe('/dashboard?x=1#h');
  });
  it('falls back to "/" for empty / missing', () => {
    expect(safeReturnPath(null, SELF)).toBe('/');
    expect(safeReturnPath('', SELF)).toBe('/');
    expect(safeReturnPath('/', SELF)).toBe('/'); // bare root has no 2nd char → "/"
  });
  it('blocks protocol-relative and backslash bypasses', () => {
    expect(safeReturnPath('//evil.com', SELF)).toBe('/');
    expect(safeReturnPath('/\\evil.com', SELF)).toBe('/');   // "/\evil.com"
    expect(safeReturnPath('/\\/evil.com', SELF)).toBe('/');
  });
  it('blocks off-site absolute URLs and prefix-match tricks', () => {
    expect(safeReturnPath('https://evil.com/x', SELF)).toBe('/');
    expect(safeReturnPath('https://auth.calcat.app.evil.com/x', SELF)).toBe('/');
    expect(safeReturnPath('https://auth.calcat.app@evil.com/x', SELF)).toBe('/');
  });
  it('reduces a same-origin absolute URL to its path', () => {
    expect(safeReturnPath('https://auth.calcat.app/dashboard?a=b', SELF)).toBe('/dashboard?a=b');
  });
});

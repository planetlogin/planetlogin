// Rate limiting — fixed window over the pluggable store. Verifies: OFF by default
// (NoneStore), blocks past the limit with a real store, keys are independent, and
// it fails OPEN if the store throws.
import { describe, it, expect } from 'vitest';
import { rateLimit, ruleFor, rlKey, DEFAULT_RULES, _stores, type SessionStore } from '../src/index.ts';

const { MemoryStore, NoneStore } = _stores;
const rule = { limit: 3, windowSeconds: 60 };

describe('rateLimit', () => {
  it('is OFF with the default NoneStore (never blocks)', async () => {
    const store = new NoneStore();
    for (let i = 0; i < 10; i++) {
      const d = await rateLimit(store, 'login:1.2.3.4', rule);
      expect(d.ok).toBe(true);
    }
  });

  it('blocks once the limit is exceeded with a real store', async () => {
    const store = new MemoryStore();
    const results = [];
    for (let i = 0; i < 5; i++) results.push(await rateLimit(store, 'login:1.2.3.4', rule));
    expect(results.map((r) => r.ok)).toEqual([true, true, true, false, false]);
    expect(results[2].remaining).toBe(0);
    expect(results[3].retryAfter).toBe(60);
  });

  it('keys are independent (one IP blocked, another fine)', async () => {
    const store = new MemoryStore();
    for (let i = 0; i < 4; i++) await rateLimit(store, 'login:1.1.1.1', rule);
    const blocked = await rateLimit(store, 'login:1.1.1.1', rule);
    const other = await rateLimit(store, 'login:2.2.2.2', rule);
    expect(blocked.ok).toBe(false);
    expect(other.ok).toBe(true);
  });

  it('fails OPEN when the store throws', async () => {
    const broken: SessionStore = {
      get: async () => null, set: async () => {}, delete: async () => {},
      claimOnce: async () => true,
      incr: async () => { throw new Error('redis down'); },
    };
    const d = await rateLimit(broken, 'login:1.2.3.4', rule);
    expect(d.ok).toBe(true);
  });
});

describe('ruleFor / rlKey', () => {
  it('returns built-in defaults', () => {
    expect(ruleFor('login')).toEqual(DEFAULT_RULES.login);
  });
  it('honors env overrides', () => {
    process.env.PLANETLOGIN_RATELIMIT_LOGIN_LIMIT = '99';
    process.env.PLANETLOGIN_RATELIMIT_LOGIN_WINDOW = '120';
    expect(ruleFor('login')).toEqual({ limit: 99, windowSeconds: 120 });
    delete process.env.PLANETLOGIN_RATELIMIT_LOGIN_LIMIT;
    delete process.env.PLANETLOGIN_RATELIMIT_LOGIN_WINDOW;
  });
  it('builds a discriminated key, falling back to anon', () => {
    expect(rlKey('login', { ip: '1.2.3.4', identifier: 'a@b.c' })).toBe('login:1.2.3.4|a@b.c');
    expect(rlKey('magic', { ip: null, identifier: null })).toBe('magic:anon');
  });
});

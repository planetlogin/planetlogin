// SessionStore: RedisStore semantics against a fake RedisLike (claimOnce uses NX,
// incr sets the window TTL on first touch) + MemoryStore bounded growth.
import { describe, it, expect } from 'vitest';
import { _stores, type RedisLike } from '../src/store.ts';

function fakeRedis() {
  const map = new Map<string, string>();
  const expires: string[] = [];
  const r: RedisLike = {
    async get(k) { return map.has(k) ? map.get(k)! : null; },
    async set(k, v, opts) {
      if (opts?.nx && map.has(k)) return null; // NX: don't overwrite
      map.set(k, v);
      return 'OK';
    },
    async del(k) { map.delete(k); },
    async incr(k) { const n = Number(map.get(k) ?? '0') + 1; map.set(k, String(n)); return n; },
    async expire(k) { expires.push(k); },
  };
  return { r, map, expires };
}

describe('RedisStore', () => {
  it('get/set/delete round-trip with the key prefix', async () => {
    const { r, map } = fakeRedis();
    const s = new _stores.RedisStore(r, 'pl:');
    await s.set('a', 'x', 60);
    expect(map.has('pl:a')).toBe(true);
    expect(await s.get('a')).toBe('x');
    await s.delete('a');
    expect(await s.get('a')).toBe(null);
  });

  it('claimOnce is single-use (NX)', async () => {
    const s = new _stores.RedisStore(fakeRedis().r);
    expect(await s.claimOnce('jti1', 900)).toBe(true);
    expect(await s.claimOnce('jti1', 900)).toBe(false);
  });

  it('incr counts up and sets the window TTL only on the first touch', async () => {
    const { r, expires } = fakeRedis();
    const s = new _stores.RedisStore(r);
    expect(await s.incr('rl:k', 300)).toBe(1);
    expect(await s.incr('rl:k', 300)).toBe(2);
    expect(await s.incr('rl:k', 300)).toBe(3);
    expect(expires).toEqual(['pl:rl:k']); // expire set exactly once
  });
});

describe('MemoryStore bounded growth', () => {
  it('never exceeds the configured max', async () => {
    process.env.PLANETLOGIN_MEMORY_STORE_MAX = '3';
    const s = new _stores.MemoryStore();
    for (let i = 0; i < 20; i++) await s.set(`k${i}`, '1', 300);
    expect((s as any).m.size).toBeLessThanOrEqual(3);
    delete process.env.PLANETLOGIN_MEMORY_STORE_MAX;
  });
});

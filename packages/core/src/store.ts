// Pluggable session/state store (config: session.store). Default "none" keeps
// PlanetLogin fully STATELESS and agnostic — nothing is stored, single-use and
// revocation degrade to short TTLs. Turn it on (memory/redis/sqlite/downstream)
// only when you want true single-use / refresh / revocation.
//
// What lives here is small and TTL-bound (single-use jti, refresh, denylist) —
// a KV's sweet spot. NOTE: a LOCAL store (memory/sqlite) makes the instance
// stateful (no horizontal scale); use redis or downstream when running >1.

export interface SessionStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  /** Atomically claim a key once: true if newly claimed, false if already present. */
  claimOnce(key: string, ttlSeconds: number): Promise<boolean>;
  /** Atomically increment a counter, setting its TTL on first touch; returns the
   *  new count. Used by the rate limiter (fixed window). */
  incr(key: string, ttlSeconds: number): Promise<number>;
}

/** No store: stateless. claimOnce always allows (single-use not enforced → TTL
 *  only); incr always returns 1 → the rate limiter never blocks. Both real
 *  single-use and rate limiting need a configured store (memory/redis/…). */
class NoneStore implements SessionStore {
  async get() { return null; }
  async set() {}
  async delete() {}
  async claimOnce() { return true; }
  async incr() { return 1; }
}

class MemoryStore implements SessionStore {
  private m = new Map<string, { v: string; exp: number }>();
  // Bound memory: rate-limit counters key on (ip|identifier), so a flood of unique
  // clients would grow the map unboundedly (entries only expire when re-read). Cap
  // the size; on overflow, sweep expired entries first, then evict oldest (insertion
  // order) until under the cap. Default 50k keys (~a few MB); override for big fleets.
  private max = Number(process.env.PLANETLOGIN_MEMORY_STORE_MAX) || 50_000;
  private alive(key: string): { v: string; exp: number } | undefined {
    const e = this.m.get(key);
    if (!e) return undefined;
    if (e.exp <= Date.now()) { this.m.delete(key); return undefined; }
    return e;
  }
  private evictIfNeeded() {
    if (this.m.size < this.max) return;
    const now = Date.now();
    for (const [k, e] of this.m) if (e.exp <= now) this.m.delete(k); // sweep expired
    while (this.m.size >= this.max) { const k = this.m.keys().next().value; if (k === undefined) break; this.m.delete(k); }
  }
  async get(key: string) { return this.alive(key)?.v ?? null; }
  async set(key: string, value: string, ttlSeconds: number) {
    this.evictIfNeeded();
    this.m.set(key, { v: value, exp: Date.now() + ttlSeconds * 1000 });
  }
  async delete(key: string) { this.m.delete(key); }
  async claimOnce(key: string, ttlSeconds: number) {
    if (this.alive(key)) return false;
    await this.set(key, '1', ttlSeconds);
    return true;
  }
  async incr(key: string, ttlSeconds: number) {
    const e = this.alive(key);
    if (!e) { await this.set(key, '1', ttlSeconds); return 1; }
    const n = Number(e.v) + 1;
    e.v = String(n); // keep the original window expiry (fixed window)
    return n;
  }
}

// Minimal Redis surface RedisStore needs — adapt your client (ioredis / node-redis)
// to this so the core never depends on a specific redis library. `set` honours an
// optional EX (ttl seconds) and NX (set-only-if-absent, returns null when it exists).
export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: { ex?: number; nx?: boolean }): Promise<string | null>;
  del(key: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
}

/** SHARED store for horizontally-scaled portals: every instance hits the same Redis,
 *  so single-use (claimOnce) and rate-limit counters are global, not per-instance. */
export class RedisStore implements SessionStore {
  constructor(private r: RedisLike, private prefix = 'pl:') {}
  private k(key: string) { return this.prefix + key; }
  async get(key: string) { return this.r.get(this.k(key)); }
  async set(key: string, value: string, ttlSeconds: number) { await this.r.set(this.k(key), value, { ex: ttlSeconds }); }
  async delete(key: string) { await this.r.del(this.k(key)); }
  async claimOnce(key: string, ttlSeconds: number) {
    const res = await this.r.set(this.k(key), '1', { ex: ttlSeconds, nx: true });
    return res !== null; // NX returns null when the key already existed
  }
  async incr(key: string, ttlSeconds: number) {
    const n = await this.r.incr(this.k(key));
    if (n === 1) await this.r.expire(this.k(key), ttlSeconds); // set the window TTL on first touch
    return n;
  }
}

export type StoreKind = 'none' | 'memory' | 'redis' | 'sqlite' | 'downstream';

let cached: SessionStore | null = null;

/** Inject a ready store (e.g. a RedisStore wrapping your client) at boot. Flavors call
 *  this when PLANETLOGIN_SESSION_STORE=redis, since the core can't construct a client. */
export function provideStore(store: SessionStore): void { cached = store; }

/** Build the store from config. `none`+`memory` are built in; `redis` must be supplied
 *  via provideStore() (the core stays client-agnostic). */
export function getStore(kind: StoreKind = (process.env.PLANETLOGIN_SESSION_STORE as StoreKind) || 'none'): SessionStore {
  if (cached) return cached;
  switch (kind) {
    case 'memory': cached = new MemoryStore(); break;
    case 'none': cached = new NoneStore(); break;
    case 'redis':
      throw new Error('session.store "redis": construct a RedisStore(client) and pass it to provideStore() at boot');
    default:
      throw new Error(`session.store "${kind}" not implemented (use none|memory, or provideStore() for redis)`);
  }
  return cached;
}

/** Reset the cached singleton (tests). */
export function _resetStore(): void { cached = null; }

export const _stores = { NoneStore, MemoryStore, RedisStore }; // for tests

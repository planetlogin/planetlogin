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
}

/** No store: stateless. claimOnce always allows (single-use not enforced → TTL only). */
class NoneStore implements SessionStore {
  async get() { return null; }
  async set() {}
  async delete() {}
  async claimOnce() { return true; }
}

class MemoryStore implements SessionStore {
  private m = new Map<string, { v: string; exp: number }>();
  private alive(key: string): { v: string; exp: number } | undefined {
    const e = this.m.get(key);
    if (!e) return undefined;
    if (e.exp <= Date.now()) { this.m.delete(key); return undefined; }
    return e;
  }
  async get(key: string) { return this.alive(key)?.v ?? null; }
  async set(key: string, value: string, ttlSeconds: number) {
    this.m.set(key, { v: value, exp: Date.now() + ttlSeconds * 1000 });
  }
  async delete(key: string) { this.m.delete(key); }
  async claimOnce(key: string, ttlSeconds: number) {
    if (this.alive(key)) return false;
    await this.set(key, '1', ttlSeconds);
    return true;
  }
}

export type StoreKind = 'none' | 'memory' | 'redis' | 'sqlite' | 'downstream';

let cached: SessionStore | null = null;

/** Build the store from config. Only none+memory ship in this flavor; the rest
 *  are declared in the spec and added per deployment need. */
export function getStore(kind: StoreKind = (process.env.PLANETLOGIN_SESSION_STORE as StoreKind) || 'none'): SessionStore {
  if (cached) return cached;
  switch (kind) {
    case 'memory': cached = new MemoryStore(); break;
    case 'none': cached = new NoneStore(); break;
    default:
      // redis / sqlite / downstream: not bundled here yet — fail loud rather than
      // silently run stateless when an operator asked for persistence.
      throw new Error(`session.store "${kind}" not implemented in this flavor (use none|memory)`);
  }
  return cached;
}

export const _stores = { NoneStore, MemoryStore }; // for tests

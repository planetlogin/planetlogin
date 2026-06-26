# Session store (`session.store`)

The store backs **rate limiting** and **true single-use** (magic-link `jti`,
denylist). It's TTL-bound KV — small and short-lived.

| Kind | Scope | Use when |
|---|---|---|
| `none` (default) | — (stateless) | agnostic default; rate limiting + single-use degrade to short TTLs only |
| `memory` | per-instance | a **single** portal instance; bounded (`PLANETLOGIN_MEMORY_STORE_MAX`, default 50k keys) |
| `redis` | **shared** | **2+ instances** behind a load balancer — counters & single-use are global |

> With `memory`, two replicas each keep their own counters → the effective rate
> limit is N× and a magic link could be replayed once per instance. For horizontal
> scale use `redis` (or any shared `RedisLike`).

## Wiring redis

The core ships `RedisStore`, which talks to a tiny `RedisLike` surface — so the core
never depends on a specific client. Adapt your client and inject it at boot
(`provideStore`), before any request is served. In the SvelteKit flavor that's the
top of `src/hooks.server.ts`:

```ts
import { provideStore, RedisStore, type RedisLike } from '@planetlogin/core';

if (process.env.PLANETLOGIN_SESSION_STORE === 'redis') {
  // ── ioredis ──
  const { default: Redis } = await import('ioredis');
  const c = new Redis(process.env.PLANETLOGIN_REDIS_URL!);
  const adapter: RedisLike = {
    get:    (k) => c.get(k),
    set:    (k, v, o) => o?.nx ? c.set(k, v, 'EX', o.ex ?? 0, 'NX') : (o?.ex ? c.set(k, v, 'EX', o.ex) : c.set(k, v)),
    del:    (k) => c.del(k),
    incr:   (k) => c.incr(k),
    expire: (k, s) => c.expire(k, s),
  };
  provideStore(new RedisStore(adapter));
}
```

```ts
// ── node-redis (v4) ──
import { createClient } from 'redis';
const c = createClient({ url: process.env.PLANETLOGIN_REDIS_URL });
await c.connect();
const adapter: RedisLike = {
  get:    (k) => c.get(k),
  set:    (k, v, o) => c.set(k, v, { EX: o?.ex, NX: o?.nx }).then((r) => (r as string | null)),
  del:    (k) => c.del(k),
  incr:   (k) => c.incr(k),
  expire: (k, s) => c.expire(k, s),
};
provideStore(new RedisStore(adapter));
```

`RedisStore` keeps keys under a `pl:` prefix (override via the 2nd constructor arg).
Any backend that satisfies `RedisLike` (Valkey, Upstash, a Cloudflare KV shim…) works.

# @planetlogin/store-postgres

A **batteries-included** [`DownstreamStore`](../core/src/downstream.ts) (spec §4) on
Postgres — the same "0-to-login wedge" as [`@planetlogin/store-sqlite`](../store-sqlite),
for the database you probably already run in production.

Following core's `RedisStore` philosophy, it bundles **no driver**: you inject any
pg-compatible client, so it works with [`pg`](https://node-postgres.com/),
`postgres.js` (wrapped), Neon/serverless, or a Drizzle session. Zero npm runtime deps
beyond the `@planetlogin/core` peer.

```ts
import { Pool } from 'pg';
import { postgresStore } from '@planetlogin/store-postgres';
import { passwordLogin, verifyPassword, signSession } from '@planetlogin/core';

const store = postgresStore(new Pool({ connectionString: process.env.DATABASE_URL }));
await store.ensureSchema();                    // idempotent — run once at boot

await store.createUser({ email: 'ada@example.com', password: 'hunter2' });

const result = await passwordLogin({ downstream: store, verifyPassword, signSession }, {
  identifier: 'ada@example.com',
  password: 'hunter2',
});
// → { ok: true, token, user }
```

## The injected client

Any object with this shape works (that's `pg`'s `Pool`/`Client` unchanged):

```ts
interface PgQueryable {
  query<R>(text: string, params?: unknown[]): Promise<{ rows: R[] }>;
}
```

- **pg / Neon**: pass the `Pool` directly.
- **postgres.js**: wrap it — `{ query: (t, p) => sql.unsafe(t, p).then((rows) => ({ rows })) }`.
- **Drizzle**: pass the underlying driver, or wrap `db.execute`.

## Options

```ts
postgresStore(client, {
  tablePrefix,   // '' by default — e.g. 'pl_' to namespace inside a shared DB
  deliverMagic,  // (data) => void | Promise<void> — send the magic link (email/SMS).
                 // Omitted → logged to the console (dev) and recorded in magic_log.
});
```

## API

Everything in core's `DownstreamStore` — `findUser`, `upsertUser`, `deliverMagic`,
`passkeysFind/Save`, `totpGet/Save`, `preferencesGet/Save` — plus:

| Helper | Purpose |
| --- | --- |
| `ensureSchema()` | Create the tables if missing (idempotent). Run once at boot. |
| `createUser({ email, password?, passwordHash?, name?, locale?, id? })` | Create an account. `password` is hashed with argon2id. A duplicate email raises `DownstreamConflictError` — which self-serve sign-up turns into a 409. |
| `setPassword(identifier, password)` | Replace a user's password (argon2id). |
| `deleteUser(identifier)` | Remove a user and their passkeys/TOTP/preferences. |

## Schema

`ensureSchema()` creates `users`, `passkeys`, `totp`, `magic_log`, `preferences`
(prefixed by `tablePrefix`). `locale` and preference `data` are stored as `JSONB`.
Emails are stored and matched lower-cased.

## When to use what

- **Anonymous only** (0 backend): the globe mints a signed locale token, no store.
- **`@planetlogin/store-sqlite`**: real accounts in one file — the quickest start.
- **`@planetlogin/store-postgres`** (this): real accounts on your production Postgres.
- **`defineStore({...})`**: a store shape core doesn't ship — implement the contract.
- **HTTP `Downstream`**: identity lives in a separate service (multi-service auth).

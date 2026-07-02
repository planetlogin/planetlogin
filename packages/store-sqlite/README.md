# @planetlogin/store-sqlite

A **batteries-included** [`DownstreamStore`](../core/src/downstream.ts) (spec §4) backed
by SQLite. It's the shortest path from *anonymous sessions* to *real accounts*: you get
persistence for password, OAuth, passkeys, TOTP and preferences **without writing a
single downstream endpoint or SQL query**.

PlanetLogin itself stays stateless — this is *your* side of the contract, made trivial.

```ts
import { sqliteStore } from '@planetlogin/store-sqlite';
import { passwordLogin, verifyPassword, signSession } from '@planetlogin/core';

const store = sqliteStore({ path: './auth.sqlite' });

// Seed a user (password is hashed with core's argon2id):
await store.createUser({ email: 'ada@example.com', password: 'hunter2', name: 'Ada' });

// Wire it into any core flow — in-process, no REST, no hop:
const result = await passwordLogin({ downstream: store, verifyPassword, signSession }, {
  identifier: 'ada@example.com',
  password: 'hunter2',
});
// → { ok: true, token, user }
```

The returned object **is** a `DownstreamStore` (so every flow accepts it directly) and
adds the account-management helpers your app needs to create and manage users.

## Requirements

Node **≥ 22.5** — this uses the built-in [`node:sqlite`](https://nodejs.org/api/sqlite.html)
module (no native build step, zero npm runtime deps). `@planetlogin/core` is a peer.

## Options

```ts
sqliteStore({
  path,          // file path (persistent) or ':memory:' (default, ephemeral)
  db,            // OR bring your own DatabaseSync connection (overrides `path`)
  deliverMagic,  // (data) => void | Promise<void> — send the magic link (email/SMS).
                 // Omitted → logged to the console (dev) and recorded in magic_log.
});
```

## API

Everything in core's `DownstreamStore` — `findUser`, `upsertUser`, `deliverMagic`,
`passkeysFind/Save`, `totpGet/Save`, `preferencesGet/Save` — plus:

| Helper | Purpose |
| --- | --- |
| `createUser({ email, password?, passwordHash?, name?, locale?, id? })` | Create an account. `password` is hashed with argon2id; or pass a precomputed `passwordHash`; or neither for an OAuth/passkey-only user. |
| `setPassword(identifier, password)` | Replace a user's password (argon2id). |
| `deleteUser(identifier)` | Remove a user and their passkeys/TOTP/preferences. |
| `db` | The underlying `DatabaseSync` — for migrations, backups, advanced queries. |
| `close()` | Close the connection (no-op if you passed your own `db`). |

## Schema

Tables are created on first use (idempotent): `users`, `passkeys`, `totp`, `magic_log`,
`preferences`. It mirrors the reference downstream in [`examples/downstream`](../../examples/downstream)
— so you can start here and later graduate to your own store (Postgres, Prisma, Drizzle)
by keeping the same `DownstreamStore` shape.

## When to use what

- **Anonymous only** (0 backend): the globe mints a signed locale token, no store.
- **`@planetlogin/store-sqlite`** (this): real accounts, in-process, one file. The wedge.
- **`defineStore({...})`**: you already have a DB — implement the contract against it.
- **HTTP `Downstream`**: identity lives in a separate service (multi-service auth).

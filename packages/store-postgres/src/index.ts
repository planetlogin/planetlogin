// @planetlogin/store-postgres — a batteries-included DownstreamStore (spec §4) on
// Postgres. Like @planetlogin/store-sqlite, but for the store you probably already
// run in production. It follows core's RedisStore philosophy: no bundled driver —
// you inject any pg-compatible client, so it works with `pg`, `postgres.js` (wrapped),
// Neon/serverless, or a Drizzle session. Zero npm runtime deps beyond peer core.
//
//   import { Pool } from 'pg';
//   import { postgresStore } from '@planetlogin/store-postgres';
//
//   const store = postgresStore(new Pool({ connectionString: process.env.DATABASE_URL }));
//   await store.ensureSchema();                 // idempotent; run once at boot
//   await store.createUser({ email: 'ada@example.com', password: 'hunter2' });
//   await passwordLogin({ downstream: store, verifyPassword, signSession }, input);
import { hashPassword } from '@planetlogin/core';
import type { DownstreamStore, DownstreamUser, UserPreferences, Locale } from '@planetlogin/core';

/** The minimal query surface this store needs — satisfied by `pg`'s Pool/Client,
 *  Neon's serverless driver, and most Postgres clients. Wrap `postgres.js` /
 *  Drizzle if their signature differs. */
export interface PgQueryable {
  query<R = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: R[] }>;
}

export interface PostgresStoreOptions {
  /** Table-name prefix (default '') — e.g. 'pl_' to namespace inside a shared DB. */
  tablePrefix?: string;
  /** How to actually deliver a magic link (email/SMS). Omitted → logged + recorded. */
  deliverMagic?: (data: { identifier: string; link: string; locale?: Locale }) => void | Promise<void>;
}

/** A `DownstreamStore` plus schema + account-management helpers. */
export interface PostgresStore extends DownstreamStore {
  /** Create the tables if missing (idempotent). Run once at boot. */
  ensureSchema(): Promise<void>;
  createUser(data: {
    email: string;
    password?: string;
    passwordHash?: string;
    name?: string;
    locale?: Locale;
    id?: string;
  }): Promise<DownstreamUser>;
  setPassword(identifier: string, password: string): Promise<void>;
  deleteUser(identifier: string): Promise<void>;
}

interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  password_hash: string | null;
  locale: Locale | null; // JSONB → already parsed
  totp_enabled: boolean;
}

const rowToUser = (r: UserRow | undefined): DownstreamUser | null =>
  r
    ? {
        id: r.id,
        email: r.email ?? undefined,
        name: r.name ?? undefined,
        passwordHash: r.password_hash ?? undefined,
        locale: r.locale ?? undefined,
        totpEnabled: !!r.totp_enabled,
      }
    : null;

export function postgresStore(db: PgQueryable, opts: PostgresStoreOptions = {}): PostgresStore {
  const p = opts.tablePrefix ?? '';
  const T = {
    users: `${p}users`,
    passkeys: `${p}passkeys`,
    totp: `${p}totp`,
    magic: `${p}magic_log`,
    prefs: `${p}preferences`,
  };
  const q = <R = Record<string, unknown>>(text: string, params?: unknown[]) => db.query<R>(text, params);
  const one = async <R>(text: string, params?: unknown[]): Promise<R | undefined> => (await q<R>(text, params)).rows[0];

  const findRow = (identifier: string) =>
    one<UserRow>(`SELECT * FROM ${T.users} WHERE email = lower($1) OR id = $1`, [identifier]);

  const store: PostgresStore = {
    async ensureSchema() {
      // One statement per call: some clients (pglite, prepared-only drivers) run a
      // single statement per query(). All are idempotent (IF NOT EXISTS).
      await q(`CREATE TABLE IF NOT EXISTS ${T.users} (
        id TEXT PRIMARY KEY, email TEXT UNIQUE, name TEXT,
        password_hash TEXT, locale JSONB, totp_enabled BOOLEAN NOT NULL DEFAULT false )`);
      await q(`CREATE TABLE IF NOT EXISTS ${T.passkeys} (
        id TEXT PRIMARY KEY, user_id TEXT NOT NULL, public_key TEXT, counter BIGINT DEFAULT 0, transports JSONB )`);
      await q(`CREATE TABLE IF NOT EXISTS ${T.totp} ( user_id TEXT PRIMARY KEY, secret TEXT, enabled BOOLEAN NOT NULL DEFAULT false )`);
      await q(`CREATE TABLE IF NOT EXISTS ${T.magic} ( id BIGSERIAL PRIMARY KEY, identifier TEXT, link TEXT, ts TIMESTAMPTZ NOT NULL DEFAULT now() )`);
      await q(`CREATE TABLE IF NOT EXISTS ${T.prefs} ( user_id TEXT PRIMARY KEY, locale JSONB, data JSONB )`);
    },

    // --- DownstreamStore contract (spec §4) -------------------------------
    async findUser(identifier) {
      return rowToUser(await findRow(identifier));
    },

    // OAuth path: create or update by email (password users come via createUser).
    async upsertUser({ provider, providerUserId, email, name }) {
      if (email) {
        const existing = await one<UserRow>(`SELECT * FROM ${T.users} WHERE email = lower($1)`, [email]);
        if (existing) {
          await q(`UPDATE ${T.users} SET name = COALESCE($1, name) WHERE id = $2`, [name ?? null, existing.id]);
          return rowToUser(await one<UserRow>(`SELECT * FROM ${T.users} WHERE id = $1`, [existing.id]));
        }
      }
      const id = `u-${provider}-${providerUserId ?? randomId()}`;
      await q(`INSERT INTO ${T.users} (id,email,name) VALUES ($1,lower($2),$3)`, [id, email ?? null, name ?? null]);
      return rowToUser(await one<UserRow>(`SELECT * FROM ${T.users} WHERE id = $1`, [id]));
    },

    async deliverMagic(data) {
      await q(`INSERT INTO ${T.magic} (identifier, link) VALUES ($1,$2)`, [data.identifier, data.link]);
      if (opts.deliverMagic) return void (await opts.deliverMagic(data));
      console.warn(`[store-postgres] MAGIC LINK for ${data.identifier}: ${data.link} (set opts.deliverMagic to send it for real)`);
      return undefined;
    },

    async passkeysFind({ userId, credentialId }) {
      if (credentialId) {
        const r = await one<{ user_id: string }>(`SELECT user_id FROM ${T.passkeys} WHERE id = $1`, [credentialId]);
        if (!r) return null;
        return { userId: r.user_id, credentials: await passkeysOf(r.user_id) };
      }
      if (!userId) return null;
      return { userId, credentials: await passkeysOf(userId) };
    },

    async passkeysSave({ userId, credential }) {
      await q(
        `INSERT INTO ${T.passkeys} (id,user_id,public_key,counter,transports) VALUES ($1,$2,$3,$4,$5::jsonb)
         ON CONFLICT (id) DO UPDATE SET counter = EXCLUDED.counter`,
        [credential.id, userId, credential.publicKey, credential.counter ?? 0, JSON.stringify(credential.transports ?? [])],
      );
      return undefined;
    },

    async totpGet({ userId }) {
      const r = await one<{ secret: string; enabled: boolean }>(`SELECT secret, enabled FROM ${T.totp} WHERE user_id = $1`, [userId]);
      return r ? { secret: r.secret, enabled: !!r.enabled } : null;
    },

    async totpSave({ userId, secret, enabled }) {
      await q(
        `INSERT INTO ${T.totp} (user_id,secret,enabled) VALUES ($1,$2,$3)
         ON CONFLICT (user_id) DO UPDATE SET secret = EXCLUDED.secret, enabled = EXCLUDED.enabled`,
        [userId, secret, !!enabled],
      );
      // Mirror the flag onto the user so password login knows to require 2FA.
      await q(`UPDATE ${T.users} SET totp_enabled = $1 WHERE id = $2`, [!!enabled, userId]);
      return undefined;
    },

    async preferencesGet({ userId }) {
      const r = await one<{ locale: Locale | null; data: Record<string, unknown> | null }>(
        `SELECT locale, data FROM ${T.prefs} WHERE user_id = $1`,
        [userId],
      );
      if (!r) return null;
      return { locale: r.locale ?? undefined, data: r.data ?? undefined };
    },

    // Partial save: locale and data are overwritten independently (COALESCE keeps the
    // other column when only one is provided).
    async preferencesSave({ userId, locale, data }: { userId: string } & UserPreferences) {
      await q(
        `INSERT INTO ${T.prefs} (user_id,locale,data) VALUES ($1,$2::jsonb,$3::jsonb)
         ON CONFLICT (user_id) DO UPDATE SET
           locale = COALESCE(EXCLUDED.locale, ${T.prefs}.locale),
           data   = COALESCE(EXCLUDED.data,   ${T.prefs}.data)`,
        [userId, locale !== undefined ? JSON.stringify(locale) : null, data !== undefined ? JSON.stringify(data) : null],
      );
      return undefined;
    },

    // --- Account management (the wedge from anon → login) -----------------
    async createUser({ email, password, passwordHash, name, locale, id }) {
      const hash = password ? await hashPassword(password) : passwordHash ?? null;
      const uid = id ?? `u-${randomId()}`;
      await q(
        `INSERT INTO ${T.users} (id,email,name,password_hash,locale) VALUES ($1,lower($2),$3,$4,$5::jsonb)`,
        [uid, email, name ?? null, hash, locale ? JSON.stringify(locale) : null],
      );
      return rowToUser(await one<UserRow>(`SELECT * FROM ${T.users} WHERE id = $1`, [uid]))!;
    },

    async setPassword(identifier, password) {
      const row = await findRow(identifier);
      if (!row) throw new Error(`@planetlogin/store-postgres: no user "${identifier}"`);
      await q(`UPDATE ${T.users} SET password_hash = $1 WHERE id = $2`, [await hashPassword(password), row.id]);
    },

    async deleteUser(identifier) {
      const row = await findRow(identifier);
      if (!row) return;
      await q(`DELETE FROM ${T.passkeys} WHERE user_id = $1`, [row.id]);
      await q(`DELETE FROM ${T.totp} WHERE user_id = $1`, [row.id]);
      await q(`DELETE FROM ${T.prefs} WHERE user_id = $1`, [row.id]);
      await q(`DELETE FROM ${T.users} WHERE id = $1`, [row.id]);
    },
  };

  async function passkeysOf(userId: string) {
    const { rows } = await q<{ id: string; public_key: string; counter: number | string; transports: unknown }>(
      `SELECT id, public_key, counter, transports FROM ${T.passkeys} WHERE user_id = $1`,
      [userId],
    );
    return rows.map((r) => ({
      id: r.id,
      publicKey: r.public_key,
      counter: Number(r.counter), // pg returns BIGINT as string
      transports: Array.isArray(r.transports) ? r.transports : [],
    }));
  }

  return store;
}

function randomId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

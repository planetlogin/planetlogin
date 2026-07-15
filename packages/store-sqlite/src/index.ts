// @planetlogin/store-sqlite — a batteries-included DownstreamStore (spec §4) on
// SQLite. It IS the "0-to-login wedge": go from anonymous sessions to real
// accounts without writing a single downstream endpoint or DB query.
//
//   import { sqliteStore } from '@planetlogin/store-sqlite';
//   const store = sqliteStore({ path: './auth.sqlite' });
//   await store.createUser({ email: 'ada@example.com', password: 'hunter2' });
//   await passwordLogin({ downstream: store, verifyPassword, signSession }, input);
//
// The returned object satisfies core's `DownstreamStore` (so every flow accepts
// it in-process — no REST, no hop) and adds the account-management helpers your
// app needs to seed users (`createUser`, `setPassword`, `deleteUser`).
//
// Backed by `node:sqlite` (Node ≥ 22.5) — zero npm runtime deps beyond the peer
// `@planetlogin/core`. The schema is created on first use (idempotent).
import { DatabaseSync } from 'node:sqlite';
import { hashPassword, DownstreamConflictError } from '@planetlogin/core';
import type { DownstreamStore, DownstreamUser, UserPreferences, Locale } from '@planetlogin/core';

export interface SqliteStoreOptions {
  /** File path for persistence, or ':memory:' for an ephemeral DB. Default ':memory:'. */
  path?: string;
  /** Bring your own connection (e.g. one you already opened). Overrides `path`. */
  db?: DatabaseSync;
  /**
   * How to actually deliver a magic link (email/SMS). The store can persist and
   * verify, but it cannot send mail — that's your side effect. If omitted, the
   * link is logged to the console (dev only) and always recorded in `magic_log`.
   */
  deliverMagic?: (data: { identifier: string; link: string; locale?: Locale }) => void | Promise<void>;
}

/** A `DownstreamStore` plus the account-management helpers to seed/manage users. */
export interface SqliteStore extends DownstreamStore {
  /** The underlying connection — for migrations, backups, or advanced queries. */
  readonly db: DatabaseSync;
  /**
   * Create a password (or password-less) user. Pass `password` and it's hashed
   * with core's argon2id; or pass a precomputed `passwordHash`; or neither for an
   * OAuth/passkey-only account.
   */
  createUser(data: {
    email: string;
    password?: string;
    passwordHash?: string;
    name?: string;
    locale?: Locale;
    id?: string;
  }): Promise<DownstreamUser>;
  /** Set/replace a user's password (hashed with core's argon2id). */
  setPassword(identifier: string, password: string): Promise<void>;
  /** Remove a user and their passkeys/totp/preferences. */
  deleteUser(identifier: string): Promise<void>;
  /** Close the connection (no-op if you passed your own `db`). */
  close(): void;
}

interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  password_hash: string | null;
  locale: string | null;
  totp_enabled: number;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE, name TEXT,
    password_hash TEXT, locale TEXT, totp_enabled INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS passkeys (
    id TEXT PRIMARY KEY, user_id TEXT, public_key TEXT, counter INTEGER, transports TEXT
  );
  CREATE TABLE IF NOT EXISTS totp ( user_id TEXT PRIMARY KEY, secret TEXT, enabled INTEGER DEFAULT 0 );
  CREATE TABLE IF NOT EXISTS magic_log ( id INTEGER PRIMARY KEY AUTOINCREMENT, identifier TEXT, link TEXT, ts TEXT );
  CREATE TABLE IF NOT EXISTS preferences ( user_id TEXT PRIMARY KEY, locale TEXT, data TEXT );
`;

const rowToUser = (r: UserRow | undefined): DownstreamUser | null =>
  r
    ? {
        id: r.id,
        email: r.email ?? undefined,
        name: r.name ?? undefined,
        passwordHash: r.password_hash ?? undefined,
        locale: r.locale ? (JSON.parse(r.locale) as Locale) : undefined,
        totpEnabled: !!r.totp_enabled,
      }
    : null;

export function sqliteStore(opts: SqliteStoreOptions = {}): SqliteStore {
  const owned = !opts.db;
  const db = opts.db ?? new DatabaseSync(opts.path ?? ':memory:');
  db.exec(SCHEMA);

  const findRow = (identifier: string) =>
    db.prepare('SELECT * FROM users WHERE email = ? OR id = ?').get(identifier, identifier) as
      | UserRow
      | undefined;

  const store: SqliteStore = {
    get db() {
      return db;
    },

    // --- DownstreamStore contract (spec §4) -------------------------------
    async findUser(identifier) {
      return rowToUser(findRow(identifier));
    },

    // OAuth path: create or update by email (password users come via createUser).
    async upsertUser({ provider, providerUserId, email, name }) {
      if (email) {
        const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
        if (existing) {
          db.prepare('UPDATE users SET name = COALESCE(?, name) WHERE id = ?').run(name ?? null, existing.id);
          return rowToUser(db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id) as unknown as UserRow);
        }
      }
      const id = `u-${provider}-${providerUserId ?? randomId()}`;
      db.prepare('INSERT INTO users (id,email,name) VALUES (?,?,?)').run(id, email ?? null, name ?? null);
      return rowToUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id) as unknown as UserRow);
    },

    async deliverMagic(data) {
      db.prepare('INSERT INTO magic_log (identifier, link, ts) VALUES (?,?,?)').run(
        data.identifier,
        data.link,
        new Date().toISOString(),
      );
      if (opts.deliverMagic) return void (await opts.deliverMagic(data));
      console.warn(`[store-sqlite] MAGIC LINK for ${data.identifier}: ${data.link} (set opts.deliverMagic to send it for real)`);
      return undefined;
    },

    async passkeysFind({ userId, credentialId }) {
      if (credentialId) {
        const r = db.prepare('SELECT * FROM passkeys WHERE id = ?').get(credentialId) as
          | { user_id: string }
          | undefined;
        if (!r) return null;
        return { userId: r.user_id, credentials: passkeysOf(r.user_id) };
      }
      if (!userId) return null;
      return { userId, credentials: passkeysOf(userId) };
    },

    async passkeysSave({ userId, credential }) {
      db.prepare(
        `INSERT INTO passkeys (id,user_id,public_key,counter,transports) VALUES (?,?,?,?,?)
         ON CONFLICT(id) DO UPDATE SET counter = excluded.counter`,
      ).run(
        credential.id,
        userId,
        credential.publicKey,
        credential.counter ?? 0,
        JSON.stringify(credential.transports ?? []),
      );
      return undefined;
    },

    async totpGet({ userId }) {
      const r = db.prepare('SELECT * FROM totp WHERE user_id = ?').get(userId) as
        | { secret: string; enabled: number }
        | undefined;
      return r ? { secret: r.secret, enabled: !!r.enabled } : null;
    },

    async totpSave({ userId, secret, enabled }) {
      db.prepare(
        `INSERT INTO totp (user_id,secret,enabled) VALUES (?,?,?)
         ON CONFLICT(user_id) DO UPDATE SET secret = excluded.secret, enabled = excluded.enabled`,
      ).run(userId, secret, enabled ? 1 : 0);
      // Mirror the flag onto the user so password login knows to require 2FA.
      db.prepare('UPDATE users SET totp_enabled = ? WHERE id = ?').run(enabled ? 1 : 0, userId);
      return undefined;
    },

    async preferencesGet({ userId }) {
      const r = db.prepare('SELECT * FROM preferences WHERE user_id = ?').get(userId) as
        | { locale: string | null; data: string | null }
        | undefined;
      if (!r) return null;
      return {
        locale: r.locale ? (JSON.parse(r.locale) as Locale) : undefined,
        data: r.data ? (JSON.parse(r.data) as Record<string, unknown>) : undefined,
      };
    },

    // Partial save: locale and data are overwritten independently.
    async preferencesSave({ userId, locale, data }: { userId: string } & UserPreferences) {
      const cur = db.prepare('SELECT * FROM preferences WHERE user_id = ?').get(userId) as
        | { locale: string | null; data: string | null }
        | undefined;
      const nextLocale = locale !== undefined ? JSON.stringify(locale) : cur?.locale ?? null;
      const nextData = data !== undefined ? JSON.stringify(data) : cur?.data ?? null;
      db.prepare(
        `INSERT INTO preferences (user_id,locale,data) VALUES (?,?,?)
         ON CONFLICT(user_id) DO UPDATE SET locale = excluded.locale, data = excluded.data`,
      ).run(userId, nextLocale, nextData);
      return undefined;
    },

    // --- Account management (the wedge from anon → login) -----------------
    async createUser({ email, password, passwordHash, name, locale, id }) {
      // Contract (§4): a taken email is a conflict, not a crash — so self-serve
      // sign-up can answer "that email is already registered".
      if (findRow(email.toLowerCase())) throw new DownstreamConflictError('email already registered');
      const hash = password ? await hashPassword(password) : passwordHash ?? null;
      const uid = id ?? `u-${randomId()}`;
      db.prepare('INSERT INTO users (id,email,name,password_hash,locale) VALUES (?,?,?,?,?)').run(
        uid,
        email.toLowerCase(),
        name ?? null,
        hash,
        locale ? JSON.stringify(locale) : null,
      );
      return rowToUser(db.prepare('SELECT * FROM users WHERE id = ?').get(uid) as unknown as UserRow)!;
    },

    async setPassword(identifier, password) {
      const row = findRow(identifier);
      if (!row) throw new Error(`@planetlogin/store-sqlite: no user "${identifier}"`);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(password), row.id);
    },

    async deleteUser(identifier) {
      const row = findRow(identifier);
      if (!row) return;
      db.prepare('DELETE FROM passkeys WHERE user_id = ?').run(row.id);
      db.prepare('DELETE FROM totp WHERE user_id = ?').run(row.id);
      db.prepare('DELETE FROM preferences WHERE user_id = ?').run(row.id);
      db.prepare('DELETE FROM users WHERE id = ?').run(row.id);
    },

    close() {
      if (owned) db.close();
    },
  };

  function passkeysOf(userId: string) {
    return (
      db.prepare('SELECT * FROM passkeys WHERE user_id = ?').all(userId) as Array<{
        id: string;
        public_key: string;
        counter: number;
        transports: string;
      }>
    ).map((r) => ({
      id: r.id,
      publicKey: r.public_key,
      counter: r.counter,
      transports: JSON.parse(r.transports || '[]'),
    }));
  }

  return store;
}

function randomId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
}

// Reference downstream for PlanetLogin (spec §4) — a REAL, persistent example you
// can adapt into your own app. Pure Node + node:sqlite, zero npm deps.
//
// This is YOUR side of the contract: the identity/persistence store. PlanetLogin
// (the portal) is stateless and calls these endpoints over REST. To use it in a real
// project, keep the route shapes and swap the `db` for your store (Postgres, Prisma,
// Drizzle, your existing user table…). Every route below maps 1:1 to a method on the
// core's Downstream client (packages/core/src/downstream.ts).
//
//   node --experimental-sqlite server.mjs      (Node ≥ 22.5; the flag silences a warning)
//
// Env:
//   PORT                         default 8799
//   PLANETLOGIN_DOWNSTREAM_SECRET  shared bearer secret the portal sends (MUST match)
//   DOWNSTREAM_DB                default ./downstream.sqlite  (':memory:' for ephemeral)
//   DEMO_SEED                    '1' (default) seeds demo@planetlogin.test / "planet42"
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';

const PORT = Number(process.env.PORT) || 8799;
const SECRET = process.env.PLANETLOGIN_DOWNSTREAM_SECRET || 'change-me';
if (SECRET === 'change-me') console.warn('[downstream] WARNING: using default secret "change-me" — set PLANETLOGIN_DOWNSTREAM_SECRET.');

const db = new DatabaseSync(process.env.DOWNSTREAM_DB || './downstream.sqlite');
db.exec(`
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
`);

// Password users are created by YOUR app (PlanetLogin only verifies the hash). Here we
// seed one with a precomputed argon2id hash of "planet42" so the password demo works.
if ((process.env.DEMO_SEED ?? '1') !== '0' && !db.prepare('SELECT 1 FROM users LIMIT 1').get()) {
  db.prepare('INSERT INTO users (id,email,name,password_hash,locale) VALUES (?,?,?,?,?)').run(
    'u-demo', 'demo@planetlogin.test', 'Demo',
    '$argon2id$v=19$m=19456,t=2,p=1$EJwyyeUzrVXHevjAneSm8A$BwU9+neuzB759IK6i7zwo13CmmZFfX7HSfJiokPVyBk',
    JSON.stringify({ language: 'en', timezone: 'UTC', country: 'US' }),
  );
  console.error('[downstream] seeded demo@planetlogin.test / planet42');
}

const rowToUser = (r) => r && {
  id: r.id, email: r.email, name: r.name,
  passwordHash: r.password_hash ?? undefined,
  locale: r.locale ? JSON.parse(r.locale) : undefined,
  totpEnabled: !!r.totp_enabled,
};

const routes = {
  // findUser(identifier) — identifier may be an email or an id.
  '/users/find': ({ identifier }) => {
    const r = db.prepare('SELECT * FROM users WHERE email = ? OR id = ?').get(identifier, identifier);
    return r ? [200, rowToUser(r)] : [404];
  },
  // upsertUser({provider, providerUserId, email, name}) — used by OAuth. Creates or
  // updates by email. (Password users are created by your app, not here.)
  '/users/upsert': ({ provider, providerUserId, email, name }) => {
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) {
      db.prepare('UPDATE users SET name = COALESCE(?, name) WHERE id = ?').run(name ?? null, existing.id);
      return [200, rowToUser(db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id))];
    }
    const id = `u-${provider}-${providerUserId ?? cryptoRandom()}`;
    db.prepare('INSERT INTO users (id,email,name) VALUES (?,?,?)').run(id, email ?? null, name ?? null);
    return [200, rowToUser(db.prepare('SELECT * FROM users WHERE id = ?').get(id))];
  },
  // deliverMagic({identifier, link}) — a real app emails/SMSes the link. Here we log it.
  '/magic/deliver': ({ identifier, link }) => {
    db.prepare('INSERT INTO magic_log (identifier, link, ts) VALUES (?,?,?)').run(identifier, link, new Date().toISOString());
    console.error(`[downstream] MAGIC LINK for ${identifier}: ${link}`);
    return [202];
  },
  // passkeysFind({userId?|credentialId?})
  '/passkeys/find': ({ userId, credentialId }) => {
    if (credentialId) {
      const r = db.prepare('SELECT * FROM passkeys WHERE id = ?').get(credentialId);
      if (!r) return [404];
      return [200, { userId: r.user_id, credentials: passkeysOf(r.user_id) }];
    }
    return [200, { userId, credentials: passkeysOf(userId) }];
  },
  '/passkeys/save': ({ userId, credential }) => {
    db.prepare(`INSERT INTO passkeys (id,user_id,public_key,counter,transports) VALUES (?,?,?,?,?)
                ON CONFLICT(id) DO UPDATE SET counter = excluded.counter`).run(
      credential.id, userId, credential.publicKey, credential.counter ?? 0,
      JSON.stringify(credential.transports ?? []),
    );
    return [201];
  },
  // totpGet / totpSave
  '/totp/find': ({ userId }) => {
    const r = db.prepare('SELECT * FROM totp WHERE user_id = ?').get(userId);
    return r ? [200, { secret: r.secret, enabled: !!r.enabled }] : [404];
  },
  '/totp/save': ({ userId, secret, enabled }) => {
    db.prepare(`INSERT INTO totp (user_id,secret,enabled) VALUES (?,?,?)
                ON CONFLICT(user_id) DO UPDATE SET secret = excluded.secret, enabled = excluded.enabled`)
      .run(userId, secret, enabled ? 1 : 0);
    // mirror the flag onto the user so password login knows to require 2FA
    db.prepare('UPDATE users SET totp_enabled = ? WHERE id = ?').run(enabled ? 1 : 0, userId);
    return [201];
  },
  // preferencesGet / preferencesSave — per-user locale + open data bag (Tier 2).
  '/preferences/find': ({ userId }) => {
    const r = db.prepare('SELECT * FROM preferences WHERE user_id = ?').get(userId);
    if (!r) return [404];
    return [200, { locale: r.locale ? JSON.parse(r.locale) : undefined, data: r.data ? JSON.parse(r.data) : undefined }];
  },
  // Partial: only the provided fields are overwritten (locale and data are independent).
  '/preferences/save': ({ userId, locale, data }) => {
    const cur = db.prepare('SELECT * FROM preferences WHERE user_id = ?').get(userId);
    const nextLocale = locale !== undefined ? JSON.stringify(locale) : (cur?.locale ?? null);
    const nextData = data !== undefined ? JSON.stringify(data) : (cur?.data ?? null);
    db.prepare(`INSERT INTO preferences (user_id,locale,data) VALUES (?,?,?)
                ON CONFLICT(user_id) DO UPDATE SET locale = excluded.locale, data = excluded.data`)
      .run(userId, nextLocale, nextData);
    return [201];
  },
};

function passkeysOf(userId) {
  return db.prepare('SELECT * FROM passkeys WHERE user_id = ?').all(userId).map((r) => ({
    id: r.id, publicKey: r.public_key, counter: r.counter, transports: JSON.parse(r.transports || '[]'),
  }));
}
function cryptoRandom() { return Math.abs(Number(BigInt('0x' + Buffer.from(crypto.getRandomValues(new Uint8Array(6))).toString('hex')))).toString(36); }

createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const send = (status, obj) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(obj === undefined ? '' : JSON.stringify(obj)); };
    if (req.headers.authorization !== `Bearer ${SECRET}`) return send(401, { error: 'unauthorized' });
    const handler = routes[req.url ?? ''];
    if (!handler) return send(404, { error: 'not_found' });
    try {
      const [status, obj] = handler(body ? JSON.parse(body) : {});
      send(status, obj);
    } catch (e) {
      console.error('[downstream] error:', e);
      send(500, { error: 'internal' });
    }
  });
}).listen(PORT, () => console.error(`[downstream] reference store on http://127.0.0.1:${PORT} (db: ${process.env.DOWNSTREAM_DB || './downstream.sqlite'})`));

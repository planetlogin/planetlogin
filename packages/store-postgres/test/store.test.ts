// Tests run on Node's native test runner (via tsx), against a real Postgres engine
// embedded in-process via PGlite (WASM) — no server, runs anywhere incl. CI/ARM. The
// same store code runs unchanged against `pg`/Neon in production.
import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { verifyPassword, passwordLogin, signSession, verifySession } from '@planetlogin/core';
import { postgresStore, type PgQueryable, type PostgresStore } from '../src/index.ts';

// One shared engine; each test gets a fresh schema (drop+recreate) for isolation.
let pg: PgQueryable;
let raw: PGlite;

before(async () => {
  raw = new PGlite();
  pg = { query: (text, params) => raw.query(text, params) };
});

async function freshStore(opts?: Parameters<typeof postgresStore>[1]): Promise<PostgresStore> {
  for (const t of ['passkeys', 'totp', 'magic_log', 'preferences', 'users']) {
    await raw.query(`DROP TABLE IF EXISTS ${t} CASCADE`);
  }
  const store = postgresStore(pg, opts);
  await store.ensureSchema();
  return store;
}

describe('postgresStore — DownstreamStore contract', () => {
  it('createUser hashes the password (argon2id) and findUser round-trips it', async () => {
    const store = await freshStore();
    const u = await store.createUser({ email: 'Ada@Example.com', password: 'hunter2', name: 'Ada' });
    assert.equal(u.email, 'ada@example.com'); // normalized
    const found = await store.findUser('ada@example.com');
    assert.equal(found?.id, u.id);
    assert.ok(found?.passwordHash?.startsWith('$argon2id$'));
    assert.equal(await verifyPassword('hunter2', found!.passwordHash!), true);
    assert.equal(await verifyPassword('wrong', found!.passwordHash!), false);
  });

  it('findUser is case-insensitive on email, works by id, null when unknown', async () => {
    const store = await freshStore();
    const u = await store.createUser({ email: 'a@b.co', password: 'x' });
    assert.equal((await store.findUser(u.id))?.id, u.id);
    assert.equal((await store.findUser('A@B.CO'))?.id, u.id);
    assert.equal(await store.findUser('nobody@nowhere'), null);
  });

  it('createUser without a password yields a credential-less account', async () => {
    const store = await freshStore();
    const u = await store.createUser({ email: 'oauth@only.io' });
    assert.equal((await store.findUser(u.id))?.passwordHash, undefined);
  });

  it('setPassword updates the hash; deleteUser removes the account', async () => {
    const store = await freshStore();
    await store.createUser({ email: 'c@d.io', password: 'old' });
    await store.setPassword('c@d.io', 'new');
    const found = await store.findUser('c@d.io');
    assert.equal(await verifyPassword('new', found!.passwordHash!), true);
    assert.equal(await verifyPassword('old', found!.passwordHash!), false);
    await store.deleteUser('c@d.io');
    assert.equal(await store.findUser('c@d.io'), null);
  });

  it('upsertUser (OAuth) creates then updates by email', async () => {
    const store = await freshStore();
    const first = await store.upsertUser({ provider: 'github', providerUserId: '42', email: 'e@f.io' });
    const second = await store.upsertUser({ provider: 'github', email: 'e@f.io', name: 'Renamed' });
    assert.equal(second?.id, first?.id); // same user, matched by email
    assert.equal((await store.findUser('e@f.io'))?.name, 'Renamed');
  });

  it('preferences save/get is partial — locale and data update independently', async () => {
    const store = await freshStore();
    const u = await store.createUser({ email: 'p@q.io' });
    await store.preferencesSave({ userId: u.id, locale: { language: 'ca', timezone: 'Europe/Madrid', country: 'ES' } });
    await store.preferencesSave({ userId: u.id, data: { theme: 'dark' } });
    const prefs = await store.preferencesGet({ userId: u.id });
    assert.equal(prefs?.locale?.language, 'ca'); // survived the data-only save
    assert.deepEqual(prefs?.data, { theme: 'dark' });
  });

  it('totp save/get and mirrors the enabled flag onto the user (2FA gate)', async () => {
    const store = await freshStore();
    const u = await store.createUser({ email: 't@u.io', password: 'x' });
    await store.totpSave({ userId: u.id, secret: 'JBSWY3DPEHPK3PXP', enabled: true });
    assert.deepEqual(await store.totpGet({ userId: u.id }), { secret: 'JBSWY3DPEHPK3PXP', enabled: true });
    assert.equal((await store.findUser(u.id))?.totpEnabled, true);
  });

  it('passkeys save then find by userId and by credentialId', async () => {
    const store = await freshStore();
    const u = await store.createUser({ email: 'k@l.io' });
    await store.passkeysSave({ userId: u.id, credential: { id: 'cred-1', publicKey: 'pk', counter: 3, transports: ['internal'] } });
    const byUser = await store.passkeysFind({ userId: u.id });
    assert.equal(byUser?.credentials[0].id, 'cred-1');
    assert.equal(byUser?.credentials[0].counter, 3); // BIGINT coerced back to number
    const byCred = await store.passkeysFind({ credentialId: 'cred-1' });
    assert.equal(byCred?.userId, u.id);
    assert.equal(await store.passkeysFind({ credentialId: 'missing' }), null);
  });

  it('deliverMagic records to magic_log and calls the custom sender', async () => {
    let delivered: { identifier: string; link: string } | null = null;
    const store = await freshStore({ deliverMagic: (d) => { delivered = { identifier: d.identifier, link: d.link }; } });
    await store.deliverMagic({ identifier: 'm@n.io', link: 'https://x/magic?t=abc' });
    assert.deepEqual(delivered, { identifier: 'm@n.io', link: 'https://x/magic?t=abc' });
    const { rows } = await raw.query('SELECT * FROM magic_log');
    assert.equal(rows.length, 1);
  });

  it('deleteUser cascades passkeys, totp and preferences', async () => {
    const store = await freshStore();
    const u = await store.createUser({ email: 'z@z.io', password: 'x' });
    await store.totpSave({ userId: u.id, secret: 's', enabled: true });
    await store.passkeysSave({ userId: u.id, credential: { id: 'c', publicKey: 'p', counter: 0 } });
    await store.preferencesSave({ userId: u.id, data: { a: 1 } });
    await store.deleteUser(u.id);
    assert.equal(await store.totpGet({ userId: u.id }), null);
    assert.equal((await store.passkeysFind({ userId: u.id }))?.credentials.length, 0);
    assert.equal(await store.preferencesGet({ userId: u.id }), null);
  });

  it('ensureSchema is idempotent (safe to call repeatedly at boot)', async () => {
    const store = await freshStore();
    await store.ensureSchema();
    await store.ensureSchema();
    const u = await store.createUser({ email: 'idem@potent.io', password: 'x' });
    assert.equal((await store.findUser(u.id))?.email, 'idem@potent.io');
  });

  it('tablePrefix namespaces the tables', async () => {
    await raw.query('DROP TABLE IF EXISTS pl_users CASCADE');
    const store = postgresStore(pg, { tablePrefix: 'pl_' });
    await store.ensureSchema();
    await store.createUser({ email: 'pre@fix.io', password: 'x' });
    const { rows } = await raw.query('SELECT count(*)::int AS n FROM pl_users');
    assert.equal((rows[0] as { n: number }).n, 1);
    await raw.query('DROP TABLE IF EXISTS pl_users CASCADE');
  });
});

describe('postgresStore — end-to-end with core password login', () => {
  it('a user created in the store logs in and yields a JWT that verifies', async () => {
    const store = await freshStore();
    await store.createUser({ email: 'demo@planetlogin.test', password: 'planet42', name: 'Demo' });

    const good = await passwordLogin({ downstream: store, verifyPassword, signSession }, {
      identifier: 'demo@planetlogin.test',
      password: 'planet42',
    });
    assert.equal(good.ok, true);
    if (good.ok === true) {
      const payload = await verifySession(good.token);
      assert.equal(payload.sub, good.user.id);
      assert.equal(payload.email, 'demo@planetlogin.test');
    }

    const bad = await passwordLogin({ downstream: store, verifyPassword, signSession }, {
      identifier: 'demo@planetlogin.test',
      password: 'wrong',
    });
    assert.deepEqual(bad, { ok: false, code: 'invalid_credentials' });

    const unknown = await passwordLogin({ downstream: store, verifyPassword, signSession }, {
      identifier: 'nobody@nowhere.io',
      password: 'whatever',
    });
    assert.deepEqual(unknown, { ok: false, code: 'invalid_credentials' });
  });

  it('2FA-enabled user returns an mfa handoff instead of a token', async () => {
    const store = await freshStore();
    const u = await store.createUser({ email: 'mfa@planetlogin.test', password: 'planet42' });
    await store.totpSave({ userId: u.id, secret: 'JBSWY3DPEHPK3PXP', enabled: true });
    const res = await passwordLogin({ downstream: store, verifyPassword, signSession }, {
      identifier: 'mfa@planetlogin.test',
      password: 'planet42',
    });
    assert.deepEqual(res, { ok: 'mfa', userId: u.id });
  });
});

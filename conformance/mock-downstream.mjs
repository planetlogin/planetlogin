// Reference downstream for the PlanetLogin conformance suite (spec §4). Pure Node,
// no deps. Implements the full §4 surface the suite exercises: users, preferences
// (partial), magic-link capture, TOTP secrets, and passkeys — so every flow can be
// verified black-box. A test-only GET /_test/* helper (no auth) lets the suite read
// what the flavor delivered.
import { createServer } from 'node:http';

const HASH = '$argon2id$v=19$m=19456,t=2,p=1$EJwyyeUzrVXHevjAneSm8A$BwU9+neuzB759IK6i7zwo13CmmZFfX7HSfJiokPVyBk'; // argon2id of "planet42"
const users = new Map([
  ['demo@planetlogin.test', { id: 'u-demo', email: 'demo@planetlogin.test', name: 'Demo', passwordHash: HASH, locale: { language: 'en', timezone: 'UTC', country: 'US' } }],
  // Separate account for the 2FA flow so enabling TOTP never affects the demo user's
  // plain password-login tests.
  ['mfa@planetlogin.test', { id: 'u-mfa', email: 'mfa@planetlogin.test', name: 'Mfa', passwordHash: HASH }],
]);
const byId = (id) => [...users.values()].find((u) => u.id === id);
const prefs = new Map();       // userId -> { locale?, data? }
const magic = new Map();       // identifier -> last delivered link
const totp = new Map();        // userId -> { secret, enabled }
const passkeys = new Map();    // userId -> [ credential ]

const server = createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const send = (s, o) => { res.writeHead(s, { 'content-type': 'application/json' }); res.end(o === undefined ? '' : JSON.stringify(o)); };
    const url = req.url || '';

    // Test-only helpers (no auth): let the suite read what the flavor delivered.
    if (url.startsWith('/_test/magic')) {
      const id = new URL(url, 'http://x').searchParams.get('identifier');
      return send(200, { link: magic.get(id) ?? null });
    }

    // The real §4 contract requires the shared bearer secret.
    if (req.headers['authorization'] !== 'Bearer test-secret') return send(401, { error: 'unauthorized' });
    const d = body ? JSON.parse(body) : {};

    if (url === '/users/find') {
      const u = users.get(d.identifier) ?? byId(d.identifier);
      return u ? send(200, u) : send(404);
    }
    if (url === '/users/upsert') {
      const existing = d.email && users.get(d.email);
      if (existing) return send(200, { id: existing.id, email: existing.email, name: d.name ?? existing.name });
      const u = { id: 'u-' + (d.providerUserId ?? d.email), email: d.email, name: d.name };
      if (d.email) users.set(d.email, u);
      return send(200, u);
    }
    if (url === '/magic/deliver') { magic.set(d.identifier, d.link); return send(202); }

    if (url === '/preferences/find') { const p = prefs.get(d.userId); return p ? send(200, p) : send(404); }
    if (url === '/preferences/save') {
      const cur = prefs.get(d.userId) ?? {};
      prefs.set(d.userId, { locale: d.locale !== undefined ? d.locale : cur.locale, data: d.data !== undefined ? d.data : cur.data });
      return send(201);
    }

    if (url === '/totp/find') { const t = totp.get(d.userId); return t ? send(200, t) : send(404); }
    if (url === '/totp/save') {
      totp.set(d.userId, { secret: d.secret, enabled: !!d.enabled });
      const u = byId(d.userId); if (u) u.totpEnabled = !!d.enabled; // mirror so password login knows to require 2FA
      return send(201);
    }

    if (url === '/passkeys/find') {
      if (d.credentialId) {
        for (const [uid, creds] of passkeys) {
          const c = creds.find((x) => x.id === d.credentialId);
          if (c) return send(200, { userId: uid, credentials: creds });
        }
        return send(404);
      }
      return send(200, { userId: d.userId, credentials: passkeys.get(d.userId) ?? [] });
    }
    if (url === '/passkeys/save') {
      const list = passkeys.get(d.userId) ?? [];
      const i = list.findIndex((x) => x.id === d.credential.id);
      if (i >= 0) list[i] = d.credential; else list.push(d.credential);
      passkeys.set(d.userId, list);
      return send(201);
    }

    send(404);
  });
});
server.listen(Number(process.env.MOCK_PORT) || 8799, () => console.error('[conformance] mock downstream on', server.address().port));

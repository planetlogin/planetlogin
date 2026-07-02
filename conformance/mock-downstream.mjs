// Reference downstream for the PlanetLogin conformance suite (spec §4). Pure Node,
// no deps. Seeds one user with a known argon2id hash so any flavor can verify it,
// stores preferences (partial), and captures magic links so the suite can complete
// the magic round-trip black-box. A test-only GET /_test/* helper (no auth) lets the
// suite read what the flavor delivered.
import { createServer } from 'node:http';

const HASH = '$argon2id$v=19$m=19456,t=2,p=1$EJwyyeUzrVXHevjAneSm8A$BwU9+neuzB759IK6i7zwo13CmmZFfX7HSfJiokPVyBk'; // argon2id of "planet42"
const users = new Map([['demo@planetlogin.test', { id: 'u-demo', email: 'demo@planetlogin.test', name: 'Demo', passwordHash: HASH, locale: { language: 'en', timezone: 'UTC', country: 'US' } }]]);
const prefs = new Map();       // userId -> { locale?, data? }
const magic = new Map();       // identifier -> last delivered link

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

    if (url === '/users/find') { const u = users.get(d.identifier); return u ? send(200, u) : send(404); }
    if (url === '/users/upsert') { const u = { id: 'u-' + (d.providerUserId ?? d.email), email: d.email, name: d.name }; users.set(u.email, u); return send(200, u); }
    if (url === '/magic/deliver') { magic.set(d.identifier, d.link); return send(202); }
    if (url === '/preferences/find') { const p = prefs.get(d.userId); return p ? send(200, p) : send(404); }
    if (url === '/preferences/save') {
      // Partial: only provided fields overwrite; omitted ones are left untouched.
      const cur = prefs.get(d.userId) ?? {};
      prefs.set(d.userId, {
        locale: d.locale !== undefined ? d.locale : cur.locale,
        data: d.data !== undefined ? d.data : cur.data,
      });
      return send(201);
    }
    send(404);
  });
});
server.listen(Number(process.env.MOCK_PORT) || 8799, () => console.error('[conformance] mock downstream on', server.address().port));

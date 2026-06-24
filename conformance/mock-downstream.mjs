// Reference downstream for the PlanetLogin conformance suite (spec §4). Pure Node,
// no deps. Seeds one user with a known argon2id hash so any flavor can verify it.
import { createServer } from 'node:http';
const HASH = '$argon2id$v=19$m=19456,t=2,p=1$EJwyyeUzrVXHevjAneSm8A$BwU9+neuzB759IK6i7zwo13CmmZFfX7HSfJiokPVyBk'; // argon2id of "planet42"
const users = new Map([['demo@planetlogin.test', { id: 'u-demo', email: 'demo@planetlogin.test', name: 'Demo', passwordHash: HASH, locale: { language: 'en', timezone: 'UTC', country: 'US' } }]]);
const server = createServer((req, res) => {
  let body = ''; req.on('data', (c) => (body += c));
  req.on('end', () => {
    const send = (s, o) => { res.writeHead(s, { 'content-type': 'application/json' }); res.end(o === undefined ? '' : JSON.stringify(o)); };
    if (req.headers['authorization'] !== 'Bearer test-secret') return send(401, { error: 'unauthorized' });
    const d = body ? JSON.parse(body) : {};
    if (req.url === '/users/find') { const u = users.get(d.identifier); return u ? send(200, u) : send(404); }
    if (req.url === '/users/upsert') { const u = { id: 'u-' + (d.providerUserId ?? d.email), email: d.email, name: d.name }; users.set(u.email, u); return send(200, u); }
    if (req.url === '/magic/deliver') return send(202);
    send(404);
  });
});
server.listen(Number(process.env.MOCK_PORT) || 8799, () => console.error('[conformance] mock downstream on', server.address().port));

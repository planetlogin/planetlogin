// A throwaway in-memory implementation of the downstream identity contract
// (spec §4). For local play (`npm run mock`) and as the e2e test's real backend.
// NOT part of PlanetLogin — it stands in for the integrator's store.
import { createServer, type Server } from 'node:http';

export interface MockUser {
  id: string; email?: string; name?: string; passwordHash?: string; totpEnabled?: boolean;
  locale?: { language?: string; timezone?: string; country?: string };
}

export interface Delivery { identifier: string; link: string }

export function createMockDownstream(users: MockUser[], deliveries: Delivery[] = []): Server {
  const byEmail = new Map(users.map((u) => [u.email, u]));
  const passkeys = new Map<string, any[]>(); // userId → credentials[]
  const totp = new Map<string, { secret: string; enabled: boolean }>(); // userId → totp
  return createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const send = (status: number, obj?: unknown) => {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(obj === undefined ? '' : JSON.stringify(obj));
      };
      const auth = req.headers['authorization'];
      if (auth !== 'Bearer test-secret') return send(401, { error: 'unauthorized' });
      const data = body ? JSON.parse(body) : {};
      if (req.url === '/users/find') {
        const u = byEmail.get(data.identifier);
        return u ? send(200, u) : send(404);
      }
      if (req.url === '/users/upsert') {
        const u: MockUser = { id: 'u-' + (data.providerUserId ?? data.email), email: data.email, name: data.name };
        byEmail.set(u.email, u);
        return send(200, u);
      }
      if (req.url === '/magic/deliver') {
        deliveries.push({ identifier: data.identifier, link: data.link });
        return send(202);
      }
      if (req.url === '/passkeys/find') {
        if (data.credentialId) {
          for (const [userId, creds] of passkeys) if (creds.some((c) => c.id === data.credentialId)) return send(200, { userId, credentials: creds });
          return send(404);
        }
        const creds = passkeys.get(data.userId);
        return creds ? send(200, { userId: data.userId, credentials: creds }) : send(200, { userId: data.userId, credentials: [] });
      }
      if (req.url === '/passkeys/save') {
        const creds = passkeys.get(data.userId) ?? [];
        const i = creds.findIndex((c) => c.id === data.credential.id);
        if (i >= 0) creds[i] = data.credential; else creds.push(data.credential);
        passkeys.set(data.userId, creds);
        return send(201);
      }
      if (req.url === '/totp/find') { const t = totp.get(data.userId); return t ? send(200, t) : send(404); }
      if (req.url === '/totp/save') { totp.set(data.userId, { secret: data.secret, enabled: data.enabled }); return send(201); }
      send(404);
    });
  });
}

// Standalone runner: `npm run mock`
if (import.meta.url === `file://${process.argv[1]}`) {
  const srv = createMockDownstream([
    { id: 'demo-1', email: 'demo@acme.com', name: 'Demo', /* password "planet42" */
      passwordHash: process.env.DEMO_HASH },
  ]);
  srv.listen(8788, () => console.log('mock downstream on http://127.0.0.1:8788'));
}

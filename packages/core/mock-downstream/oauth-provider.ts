// A throwaway OAuth2 provider for tests: /token exchanges a fixed code for an
// access token (and checks code_verifier is present), /userinfo returns a profile.
// Stands in for Google/GitHub/etc.
import { createServer, type Server } from 'node:http';

export interface MockOAuthOptions {
  code: string; // the authorization code it accepts
  profile: { sub: string; email?: string; name?: string };
}

export function createMockOAuthProvider(opts: MockOAuthOptions): Server {
  return createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const json = (status: number, obj: unknown) => {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(obj));
      };
      if (req.url === '/token' && req.method === 'POST') {
        const p = new URLSearchParams(body);
        if (p.get('grant_type') !== 'authorization_code' || p.get('code') !== opts.code || !p.get('code_verifier'))
          return json(400, { error: 'invalid_grant' });
        return json(200, { access_token: 'mock-access-token', token_type: 'Bearer', expires_in: 3600 });
      }
      if (req.url === '/userinfo') {
        if (req.headers['authorization'] !== 'Bearer mock-access-token') return json(401, { error: 'unauthorized' });
        return json(200, opts.profile);
      }
      json(404, { error: 'not_found' });
    });
  });
}

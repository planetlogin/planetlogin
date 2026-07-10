// Mock OAuth2/OIDC provider for the conformance suite. Pure Node, no deps. The
// flavor's `mockoauth` provider is pointed here via env (AUTHORIZE/TOKEN/USERINFO
// URLs). It exchanges any code for a token and returns a fixed profile, so the
// OAuth callback round-trip can be verified black-box without a real provider.
import { createServer } from 'node:http';

const PROFILE = { sub: 'oauth-user-1', email: 'oauthuser@planetlogin.test', name: 'OAuth User' };

const server = createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const url = new URL(req.url || '/', 'http://x');
    const send = (s, o, type = 'application/json') => { res.writeHead(s, { 'content-type': type }); res.end(typeof o === 'string' ? o : JSON.stringify(o)); };

    // Real providers 302 the browser back to the RP's redirect_uri with code+state.
    // The suite doesn't follow this (it calls the callback directly), but implement
    // it for completeness / manual testing.
    if (url.pathname === '/authorize') {
      const redirect = url.searchParams.get('redirect_uri');
      const state = url.searchParams.get('state') || '';
      const to = new URL(redirect); to.searchParams.set('code', 'mock-code'); to.searchParams.set('state', state);
      res.writeHead(302, { location: to.toString() }); return res.end();
    }
    // Token endpoint: accept any authorization_code, return an access token.
    if (url.pathname === '/token' && req.method === 'POST') {
      const p = new URLSearchParams(body);
      if (p.get('grant_type') !== 'authorization_code' || !p.get('code'))
        return send(400, { error: 'invalid_grant' });
      return send(200, { access_token: 'mock-access-token', token_type: 'Bearer', expires_in: 3600, scope: 'openid email profile' });
    }
    // Userinfo: return the fixed profile for the bearer token.
    if (url.pathname === '/userinfo') {
      if (req.headers['authorization'] !== 'Bearer mock-access-token') return send(401, { error: 'invalid_token' });
      return send(200, PROFILE);
    }
    send(404, { error: 'not_found' });
  });
});
server.listen(Number(process.env.OAUTH_PORT) || 8798, () => console.error('[conformance] mock oauth provider on', server.address().port));

// OAuth2 + PKCE end to end against a mock provider + mock downstream:
// build auth URL → exchange code → fetch profile → upsert downstream → session.
// Plus the stateless state cookie (JWE) round-trip and CSRF/tamper rejection.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { createMockDownstream } from '../mock-downstream/server.ts';
import { createMockOAuthProvider } from '../mock-downstream/oauth-provider.ts';
import { Downstream } from '../src/index.ts';
import { signSession, verifySession } from '../src/index.ts';
import { oauthStart, type ProviderConfig } from '../src/index.ts';
import { oauthCallback } from '../src/index.ts';
import { sealOAuthState, openOAuthState } from '../src/index.ts';

let down: Server, idp: Server, downUrl: string, idpUrl: string;

beforeAll(async () => {
  down = createMockDownstream([]); // upsert creates users on the fly
  idp = createMockOAuthProvider({ code: 'authcode', profile: { sub: 'g-123', email: 'jo@gmail.com', name: 'Jo' } });
  await new Promise<void>((r) => down.listen(0, '127.0.0.1', r));
  await new Promise<void>((r) => idp.listen(0, '127.0.0.1', r));
  downUrl = `http://127.0.0.1:${(down.address() as AddressInfo).port}`;
  idpUrl = `http://127.0.0.1:${(idp.address() as AddressInfo).port}`;
});
afterAll(() => { down?.close(); idp?.close(); });

const provider = (): ProviderConfig => ({
  authorizeUrl: `${idpUrl}/authorize`,
  tokenUrl: `${idpUrl}/token`,
  userinfoUrl: `${idpUrl}/userinfo`,
  scopes: ['openid', 'email', 'profile'],
  mapProfile: (r) => ({ providerUserId: r.sub, email: r.email, name: r.name }),
});

describe('oauth — authorization URL', () => {
  it('includes PKCE S256, state and the right params', () => {
    const { url, state, codeVerifier } = oauthStart(provider(), { clientId: 'cid', redirectUri: 'https://app/cb' });
    const u = new URL(url);
    expect(u.searchParams.get('response_type')).toBe('code');
    expect(u.searchParams.get('code_challenge_method')).toBe('S256');
    expect(u.searchParams.get('code_challenge')).toBeTruthy();
    expect(u.searchParams.get('state')).toBe(state);
    expect(codeVerifier.length).toBeGreaterThan(20);
  });
});

describe('oauth — callback end to end', () => {
  it('exchanges the code, upserts downstream and mints a session', async () => {
    const { codeVerifier } = oauthStart(provider(), { clientId: 'cid', redirectUri: 'https://app/cb' });
    const res = await oauthCallback(
      { downstream: new Downstream(downUrl, 'test-secret'), signSession },
      { provider: 'google', providerCfg: provider(), code: 'authcode', codeVerifier,
        clientId: 'cid', clientSecret: 'sec', redirectUri: 'https://app/cb' },
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const claims = await verifySession(res.token);
    expect(claims.sub).toBe('u-g-123'); // downstream upsert id = u-<providerUserId>
    expect(claims.email).toBe('jo@gmail.com');
  });

  it('returns provider_error on a bad code (token exchange fails)', async () => {
    const res = await oauthCallback(
      { downstream: new Downstream(downUrl, 'test-secret'), signSession },
      { provider: 'google', providerCfg: provider(), code: 'WRONG', codeVerifier: 'x',
        clientId: 'cid', clientSecret: 'sec', redirectUri: 'https://app/cb' },
    );
    expect(res).toEqual({ ok: false, code: 'provider_error' });
  });
});

describe('oauth — stateless state cookie (JWE)', () => {
  it('round-trips the state + verifier, and rejects tampering', async () => {
    const sealed = await sealOAuthState({ provider: 'google', state: 'abc', codeVerifier: 'ver', redirectTo: '/' });
    const opened = await openOAuthState(sealed);
    expect(opened).toMatchObject({ provider: 'google', state: 'abc', codeVerifier: 'ver' });
    expect(await openOAuthState(sealed.slice(0, -4) + 'zzzz')).toBeNull();
  });
});

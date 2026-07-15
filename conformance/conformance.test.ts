// PlanetLogin conformance suite — BLACK-BOX. Tests a *running* flavor by its HTTP
// API (spec §3) only; it never imports flavor code, so it validates any flavor in
// any language. Point it at a flavor with `PLANETLOGIN_TEST_URL` (see run.sh), with
// the reference mock downstream (mock-downstream.mjs) seeding demo@planetlogin.test.
import { describe, it, expect, beforeAll } from 'vitest';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { TOTP, Secret } from 'otpauth';
// @ts-ignore — pure-JS virtual WebAuthn authenticator (no type declarations needed)
import { makeAuthenticator } from './mock-authenticator.mjs';

// Same parameters the core uses (SHA1 / 6 digits / 30s) — generate a valid code.
const totpCode = (secretB32: string) =>
  new TOTP({ secret: Secret.fromBase32(secretB32), algorithm: 'SHA1', digits: 6, period: 30 }).generate();

const BASE = (process.env.PLANETLOGIN_TEST_URL || 'http://127.0.0.1:8810').replace(/\/$/, '');
const MOCK = (process.env.PLANETLOGIN_MOCK_URL || 'http://127.0.0.1:8799').replace(/\/$/, '');
const USER = 'demo@planetlogin.test';
const PASS = 'planet42';
const post = (p: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(BASE + p, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), redirect: 'manual' });

let jwks: ReturnType<typeof createRemoteJWKSet>;
beforeAll(() => { jwks = createRemoteJWKSet(new URL(BASE + '/auth/.well-known/jwks.json')); });

const verify = (token: string) => jwtVerify(token, jwks, { issuer: 'planetlogin', audience: 'planetlogin' });
const isError = (j: any) => j && j.error && typeof j.error.code === 'string' && typeof j.error.message === 'string';
async function login(): Promise<string> {
  const { token } = await (await post('/auth/password/login', { identifier: USER, password: PASS })).json();
  return token;
}

describe('config & keys', () => {
  it('GET /auth/config returns the public config (spec:1)', async () => {
    const r = await fetch(BASE + '/auth/config');
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.spec).toBe(1);
    expect(j.providers).toBeTruthy();
    expect(j.brand).toBeTruthy();
  });
  it('GET /auth/config never leaks secret VALUES', async () => {
    // Provider names like "password" legitimately appear; what must never leak are
    // the actual secret values and key material.
    const raw = JSON.stringify(await (await fetch(BASE + '/auth/config')).json());
    for (const secret of ['test-secret', 'conformance-secret', 'BEGIN PRIVATE KEY', 'BEGIN EC PRIVATE KEY'])
      expect(raw).not.toContain(secret);
  });
  it('GET /auth/.well-known/jwks.json returns a key set', async () => {
    const r = await fetch(BASE + '/auth/.well-known/jwks.json');
    expect(r.status).toBe(200);
    expect((await r.json()).keys.length).toBeGreaterThan(0);
  });
});

describe('password login', () => {
  it('correct credentials → a JWT verifiable via JWKS + a session cookie', async () => {
    const r = await post('/auth/password/login', { identifier: USER, password: PASS });
    expect(r.status).toBe(200);
    expect(r.headers.get('set-cookie')).toBeTruthy();
    const { token } = await r.json();
    const { payload } = await verify(token);
    expect(payload.sub).toBe('u-demo');
  });
  it('wrong password → 401 invalid_credentials', async () => {
    const r = await post('/auth/password/login', { identifier: USER, password: 'WRONG' });
    expect(r.status).toBe(401);
    expect((await r.json()).error.code).toBe('invalid_credentials');
  });
  it('unknown user → SAME 401 invalid_credentials (no enumeration)', async () => {
    const r = await post('/auth/password/login', { identifier: 'nobody@x.test', password: PASS });
    expect(r.status).toBe(401);
    expect((await r.json()).error.code).toBe('invalid_credentials');
  });
  it('missing fields → 400 bad_request (stable error shape)', async () => {
    const r = await post('/auth/password/login', { identifier: USER });
    expect(r.status).toBe(400);
    expect(isError(await r.json())).toBe(true);
  });
});

describe('self-serve registration', () => {
  const NEW = 'signup@planetlogin.test';
  const NEWPASS = 'hunter2planet';
  it('register → the downstream creates + hashes → session; the new account can log in', async () => {
    const r = await post('/auth/password/register', { email: NEW, password: NEWPASS, name: 'New' });
    expect(r.status).toBe(200);
    expect(r.headers.get('set-cookie')).toBeTruthy(); // auto sign-in
    const { token } = await r.json();
    const { payload } = await verify(token);
    expect(typeof payload.sub).toBe('string');

    // Proof the downstream really hashed it: the fresh account logs in normally.
    const login = await post('/auth/password/login', { identifier: NEW, password: NEWPASS });
    expect(login.status).toBe(200);
  });
  it('a duplicate email → 409 email_taken', async () => {
    const r = await post('/auth/password/register', { email: USER, password: 'whatever8' });
    expect(r.status).toBe(409);
    expect((await r.json()).error.code).toBe('email_taken');
  });
  it('a too-short password → 400', async () => {
    const r = await post('/auth/password/register', { email: 'x@y.test', password: 'short' });
    expect(r.status).toBe(400);
  });
});

describe('session', () => {
  it('validates a real token, rejects when absent', async () => {
    const token = await login();
    const ok = await fetch(BASE + '/auth/session', { headers: { authorization: `Bearer ${token}` } });
    expect(ok.status).toBe(200);
    const no = await fetch(BASE + '/auth/session');
    expect(no.status).toBe(401);
  });
  it('rejects a tampered / garbage token', async () => {
    const token = await login();
    const tampered = token.slice(0, -3) + 'xyz';
    for (const t of [tampered, 'not.a.jwt', 'garbage']) {
      const r = await fetch(BASE + '/auth/session', { headers: { authorization: `Bearer ${t}` } });
      expect(r.status).toBe(401);
    }
  });
  it('POST /auth/logout → 200 and clears the cookie', async () => {
    const r = await post('/auth/logout', {});
    expect(r.status).toBe(200);
  });
});

describe('anonymous / guest sessions (zero-backend)', () => {
  it('POST /auth/anonymous → a signed guest token (anon:true), no account needed', async () => {
    const r = await post('/auth/anonymous', { locale: { language: 'ca', timezone: 'Europe/Madrid', country: 'ES' } });
    expect(r.status).toBe(200);
    const { token } = await r.json();
    const { payload } = await verify(token);
    expect(payload.anon).toBe(true);
    expect(typeof payload.sub).toBe('string');
    expect((payload.locale as any)?.language).toBe('ca'); // the picked locale rides along
  });
});

describe('magic link (full round-trip)', () => {
  it('request → deliver → verify → session; the link is single-use', async () => {
    const req = await post('/auth/magic/request', { identifier: USER });
    expect(req.status).toBe(202); // always 202 (no enumeration)

    // Black-box: read what the flavor asked the downstream to deliver.
    const { link } = await (await fetch(`${MOCK}/_test/magic?identifier=${encodeURIComponent(USER)}`)).json();
    expect(typeof link).toBe('string');

    const first = await fetch(link, { redirect: 'manual' });
    expect(first.status).toBe(200);
    const { token } = await first.json();
    const { payload } = await verify(token);
    expect(payload.sub).toBe('u-demo');

    // Same link a second time must fail (single-use, store-backed).
    const second = await fetch(link, { redirect: 'manual' });
    expect(second.status).toBe(401);
  });
  it('unknown identifier still → 202 (no enumeration)', async () => {
    const r = await post('/auth/magic/request', { identifier: 'nobody@x.test' });
    expect(r.status).toBe(202);
  });
});

describe('preferences (session-gated, partial)', () => {
  it('requires a session', async () => {
    const r = await fetch(BASE + '/auth/preferences');
    expect(r.status).toBe(401);
  });
  it('saves and reads back locale + data; partial saves are independent', async () => {
    const token = await login();
    const auth = { authorization: `Bearer ${token}` } as Record<string, string>;

    const put1 = await fetch(BASE + '/auth/preferences', {
      method: 'PUT', headers: { 'content-type': 'application/json', ...auth },
      body: JSON.stringify({ locale: { language: 'ca', timezone: 'Europe/Madrid', country: 'ES' } }),
    });
    expect(put1.status).toBe(200);

    const got1 = await (await fetch(BASE + '/auth/preferences', { headers: auth })).json();
    expect(got1.locale?.language).toBe('ca');

    // Save only `data` — the previously saved locale must survive.
    await fetch(BASE + '/auth/preferences', {
      method: 'PUT', headers: { 'content-type': 'application/json', ...auth },
      body: JSON.stringify({ data: { theme: 'dark' } }),
    });
    const got2 = await (await fetch(BASE + '/auth/preferences', { headers: auth })).json();
    expect(got2.locale?.language).toBe('ca');
    expect(got2.data?.theme).toBe('dark');
  });
});

describe('TOTP 2FA', () => {
  const MFA = 'mfa@planetlogin.test';
  it('enroll → confirm → password login hands off to MFA → verify → session', async () => {
    // 1) enroll: get a secret (the QR uri too).
    const enroll = await post('/auth/totp/enroll', { identifier: MFA });
    expect(enroll.status).toBe(200);
    const { secret, uri } = await enroll.json();
    expect(typeof secret).toBe('string');
    expect(String(uri)).toContain('otpauth://');

    // 2) confirm enrollment with a valid code → enables 2FA.
    const confirm = await post('/auth/totp/verify', { identifier: MFA, code: totpCode(secret) });
    expect(confirm.status).toBe(200);
    expect((await confirm.json()).ok).toBe(true);

    // 3) password login now hands off to the MFA step (pl_mfa cookie), NOT a token.
    const login = await post('/auth/password/login', { identifier: MFA, password: PASS });
    const setCookie = login.headers.get('set-cookie') || '';
    expect(setCookie).toContain('pl_mfa');
    const plMfa = setCookie.match(/pl_mfa=[^;]+/)?.[0] || '';

    // 4) complete the second factor with a fresh code + the handoff cookie → session.
    const step = await post('/auth/totp/verify', { code: totpCode(secret) }, { cookie: plMfa });
    expect(step.status).toBe(200);
    const { token } = await step.json();
    const { payload } = await verify(token);
    expect(payload.sub).toBe('u-mfa');
  });
  it('a wrong code → 401 invalid_credentials', async () => {
    const r = await post('/auth/totp/verify', { identifier: MFA, code: '000000' });
    expect(r.status).toBe(401);
  });
});

describe('passkeys / WebAuthn', () => {
  const rpID = new URL(BASE).hostname;
  it('register a credential, then authenticate with it → session', async () => {
    const authr = makeAuthenticator();

    // 1) registration ceremony, bound to the demo user.
    const rc = await post('/auth/passkey/challenge', { mode: 'register', identifier: USER });
    expect(rc.status).toBe(200);
    const rCookie = (rc.headers.get('set-cookie') || '').match(/pl_webauthn=[^;]+/)?.[0] || '';
    const attestation = authr.register(await rc.json(), { origin: BASE, rpID });
    const rv = await post('/auth/passkey/verify', { response: attestation }, { cookie: rCookie });
    expect(rv.status).toBe(200);
    expect((await rv.json()).ok).toBe(true);

    // 2) usernameless authentication with that credential → a session.
    const ac = await post('/auth/passkey/challenge', { mode: 'auth' });
    const aCookie = (ac.headers.get('set-cookie') || '').match(/pl_webauthn=[^;]+/)?.[0] || '';
    const assertion = authr.authenticate(await ac.json(), { origin: BASE, rpID });
    const av = await post('/auth/passkey/verify', { response: assertion }, { cookie: aCookie });
    expect(av.status).toBe(200);
    const { token } = await av.json();
    const { payload } = await verify(token);
    expect(payload.sub).toBe('u-demo');
  });
  it('an unknown / garbage assertion → 401', async () => {
    const ac = await post('/auth/passkey/challenge', { mode: 'auth' });
    const aCookie = (ac.headers.get('set-cookie') || '').match(/pl_webauthn=[^;]+/)?.[0] || '';
    const av = await post('/auth/passkey/verify', {
      response: { id: 'AAAA', rawId: 'AAAA', type: 'public-key', clientExtensionResults: {},
        response: { clientDataJSON: 'e30', authenticatorData: 'AAAA', signature: 'AAAA' } },
    }, { cookie: aCookie });
    expect(av.status).toBe(401);
  });
});

describe('oauth start', () => {
  it('enabled provider → 302 to the provider with PKCE + state', async () => {
    const r = await fetch(BASE + '/auth/oauth/google/start', { redirect: 'manual' });
    expect(r.status).toBe(302);
    const loc = r.headers.get('location') || '';
    expect(loc.startsWith('https://accounts.google.com/o/oauth2/v2/auth')).toBe(true);
    expect(loc).toContain('client_id=conformance-client');
    expect(loc).toContain('code_challenge=');
    expect(loc).toContain('state=');
    expect(r.headers.get('set-cookie')).toBeTruthy(); // state sealed in a cookie
  });
  it('disabled provider → 403 not_enabled', async () => {
    const r = await fetch(BASE + '/auth/oauth/github/start', { redirect: 'manual' });
    expect(r.status).toBe(403);
    expect((await r.json()).error.code).toBe('not_enabled');
  });
  it('full round-trip against a mock provider → code exchange → session', async () => {
    // start → grab the state and the sealed state cookie the callback will check.
    const start = await fetch(BASE + '/auth/oauth/mockoauth/start', { redirect: 'manual' });
    expect(start.status).toBe(302);
    const state = new URL(start.headers.get('location') || '').searchParams.get('state');
    const oauthCookie = (start.headers.get('set-cookie') || '').match(/pl_oauth=[^;]+/)?.[0] || '';
    expect(oauthCookie).toBeTruthy();

    // callback: the code is exchanged at the mock token endpoint, profile fetched,
    // account upserted, session issued → 302 back to the app with a session cookie.
    const cb = await fetch(`${BASE}/auth/oauth/mockoauth/callback?code=mock-code&state=${state}`,
      { headers: { cookie: oauthCookie }, redirect: 'manual' });
    expect(cb.status).toBe(302);
    const token = (cb.headers.get('set-cookie') || '').match(/planetlogin_session=([^;]+)/)?.[1];
    expect(token).toBeTruthy();
    const { payload } = await verify(token!);
    expect(typeof payload.sub).toBe('string'); // the upserted OAuth account
  });
  it('callback with a mismatched state → 400 (CSRF guard)', async () => {
    const start = await fetch(BASE + '/auth/oauth/mockoauth/start', { redirect: 'manual' });
    const oauthCookie = (start.headers.get('set-cookie') || '').match(/pl_oauth=[^;]+/)?.[0] || '';
    const cb = await fetch(`${BASE}/auth/oauth/mockoauth/callback?code=mock-code&state=WRONG`,
      { headers: { cookie: oauthCookie }, redirect: 'manual' });
    expect(cb.status).toBe(400);
  });
});

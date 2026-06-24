// PlanetLogin conformance suite — BLACK-BOX. Tests a *running* flavor by its HTTP
// API (spec §3) only; it never imports flavor code, so it validates any flavor in
// any language. Point it at a flavor with `PLANETLOGIN_TEST_URL` (see run.sh), with
// the reference mock downstream (mock-downstream.mjs) seeding demo@planetlogin.test.
import { describe, it, expect, beforeAll } from 'vitest';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const BASE = (process.env.PLANETLOGIN_TEST_URL || 'http://127.0.0.1:8810').replace(/\/$/, '');
const USER = 'demo@planetlogin.test';
const PASS = 'planet42';
const post = (p: string, body: unknown) =>
  fetch(BASE + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), redirect: 'manual' });

let jwks: ReturnType<typeof createRemoteJWKSet>;
beforeAll(() => { jwks = createRemoteJWKSet(new URL(BASE + '/auth/.well-known/jwks.json')); });

const isError = (j: any) => j && j.error && typeof j.error.code === 'string' && typeof j.error.message === 'string';

describe('config & keys', () => {
  it('GET /auth/config returns the public config (spec:1)', async () => {
    const r = await fetch(BASE + '/auth/config');
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.spec).toBe(1);
    expect(j.providers).toBeTruthy();
    expect(j.brand).toBeTruthy();
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
    const { payload } = await jwtVerify(token, jwks, { issuer: 'planetlogin', audience: 'planetlogin' });
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

describe('session & magic', () => {
  it('GET /auth/session validates a token, rejects without one', async () => {
    const { token } = await (await post('/auth/password/login', { identifier: USER, password: PASS })).json();
    const ok = await fetch(BASE + '/auth/session', { headers: { authorization: `Bearer ${token}` } });
    expect(ok.status).toBe(200);
    const no = await fetch(BASE + '/auth/session');
    expect(no.status).toBe(401);
  });
  it('POST /auth/magic/request → 202 (no enumeration)', async () => {
    const r = await post('/auth/magic/request', { identifier: USER });
    expect(r.status).toBe(202);
  });
});

// End-to-end proof that the spec's password flow is buildable & correct:
// real argon2id, a real HTTP downstream (the mock), real EdDSA JWT issuance, and
// verification through the JWKS — exactly what a downstream service would do.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { createMockDownstream } from '../mock-downstream/server.ts';
import { Downstream } from '../src/index.ts';
import { hashPassword, verifyPassword } from '../src/index.ts';
import { signSession, verifySession } from '../src/index.ts';
import { passwordLogin } from '../src/index.ts';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const hash = await hashPassword('planet42');
  server = createMockDownstream([
    { id: 'u-demo', email: 'demo@acme.com', name: 'Demo', passwordHash: hash,
      locale: { language: 'es', timezone: 'Europe/Madrid', country: 'ES' } },
  ]);
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server?.close());

const deps = () => ({
  downstream: new Downstream(baseUrl, 'test-secret'),
  verifyPassword,
  signSession,
});

describe('password login — end to end', () => {
  it('issues a verifiable session token on correct credentials', async () => {
    const res = await passwordLogin(deps(), {
      identifier: 'demo@acme.com', password: 'planet42',
      locale: { language: 'es', timezone: 'Europe/Madrid', country: 'ES' },
    });
    expect(res.ok).toBe(true);
    if (res.ok !== true) return;

    // a downstream service verifies the token via our JWKS
    const claims = await verifySession(res.token);
    expect(claims.sub).toBe('u-demo');
    expect(claims.email).toBe('demo@acme.com');
    expect((claims.locale as any).timezone).toBe('Europe/Madrid');
    expect(claims.iss).toBe('planetlogin');
  });

  it('rejects a wrong password with invalid_credentials', async () => {
    const res = await passwordLogin(deps(), { identifier: 'demo@acme.com', password: 'WRONG' });
    expect(res).toEqual({ ok: false, code: 'invalid_credentials' });
  });

  it('does not enumerate: unknown user gives the same error', async () => {
    const res = await passwordLogin(deps(), { identifier: 'nobody@acme.com', password: 'planet42' });
    expect(res).toEqual({ ok: false, code: 'invalid_credentials' });
  });

  it('fails closed when the downstream is unreachable', async () => {
    const broken = { downstream: new Downstream('http://127.0.0.1:1', 'test-secret', 300), verifyPassword, signSession };
    const res = await passwordLogin(broken, { identifier: 'demo@acme.com', password: 'planet42' });
    expect(res).toEqual({ ok: false, code: 'downstream_unavailable' });
  });
});

describe('crypto primitives', () => {
  it('argon2id hash verifies and rejects', async () => {
    const h = await hashPassword('correct horse');
    expect(await verifyPassword('correct horse', h)).toBe(true);
    expect(await verifyPassword('battery staple', h)).toBe(false);
  });

  it('a tampered token fails verification', async () => {
    const t = await signSession({ sub: 'x' });
    await expect(verifySession(t.slice(0, -3) + 'aaa')).rejects.toBeTruthy();
  });
});

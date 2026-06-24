// TOTP (2FA) end to end: enroll → store secret downstream → verify a real code
// (generated with otpauth) → enable. Plus the password→MFA handoff.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { TOTP, Secret } from 'otpauth';
import { createMockDownstream, type MockUser } from '../mock-downstream/server.ts';
import { Downstream } from '../src/index.ts';
import { signSession } from '../src/index.ts';
import { verifyPassword, hashPassword } from '../src/index.ts';
import { totpEnroll, totpVerify } from '../src/index.ts';
import { passwordLogin } from '../src/index.ts';

let down: Server, url: string;
const mfaUser: MockUser = { id: 'u-mfa', email: 'mfa@acme.com', name: 'Mfa', totpEnabled: true };

beforeAll(async () => {
  mfaUser.passwordHash = await hashPassword('pw');
  down = createMockDownstream([mfaUser]);
  await new Promise<void>((r) => down.listen(0, '127.0.0.1', r));
  url = `http://127.0.0.1:${(down.address() as AddressInfo).port}`;
});
afterAll(() => down?.close());
const ds = () => new Downstream(url, 'test-secret');
const codeFor = (secret: string) => new TOTP({ secret: Secret.fromBase32(secret), period: 30, digits: 6, algorithm: 'SHA1' }).generate();

describe('totp — enroll & verify', () => {
  it('enrolls (secret + otpauth uri) and verifies a real code, enabling it', async () => {
    const { secret, uri } = await totpEnroll({ downstream: ds() }, { userId: 'u-mfa', label: 'mfa@acme.com', issuer: 'Acme' });
    expect(uri.startsWith('otpauth://totp/')).toBe(true);
    expect(secret.length).toBeGreaterThan(15);

    const ok = await totpVerify({ downstream: ds() }, { userId: 'u-mfa', code: codeFor(secret) });
    expect(ok).toEqual({ ok: true });
    // now enabled downstream
    expect((await ds().totpGet({ userId: 'u-mfa' }))?.enabled).toBe(true);
  });

  it('rejects a wrong code', async () => {
    const { secret } = await totpEnroll({ downstream: ds() }, { userId: 'u-mfa', label: 'x' });
    expect(await totpVerify({ downstream: ds() }, { userId: 'u-mfa', code: '000000' })).toEqual({ ok: false });
    expect(secret).toBeTruthy();
  });
});

describe('password → MFA handoff', () => {
  it('a totpEnabled user gets ok:mfa instead of a session', async () => {
    const res = await passwordLogin(
      { downstream: ds(), verifyPassword, signSession },
      { identifier: 'mfa@acme.com', password: 'pw' },
    );
    expect(res).toEqual({ ok: 'mfa', userId: 'u-mfa' });
  });
});

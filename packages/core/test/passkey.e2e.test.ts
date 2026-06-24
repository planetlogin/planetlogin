// Passkeys: the WebAuthn crypto is @simplewebauthn's job (trusted, audited). Here
// we prove (a) real options generation produces a challenge, and (b) our
// orchestration around the verifiers + the downstream credential store is correct
// — by injecting fake verifiers (a real authenticator/fixture lands in conformance).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { createMockDownstream } from '../mock-downstream/server.ts';
import { Downstream } from '../src/index.ts';
import { signSession, verifySession } from '../src/index.ts';
import { registrationOptions, authenticationOptions, type StoredCredential } from '../src/index.ts';
import { passkeyRegisterVerify, passkeyAuthVerify } from '../src/index.ts';

let down: Server, url: string;
beforeAll(async () => {
  down = createMockDownstream([{ id: 'u-jo', email: 'jo@acme.com', name: 'Jo' }]);
  await new Promise<void>((r) => down.listen(0, '127.0.0.1', r));
  url = `http://127.0.0.1:${(down.address() as AddressInfo).port}`;
});
afterAll(() => down?.close());
const ds = () => new Downstream(url, 'test-secret');

describe('passkey — options (real @simplewebauthn)', () => {
  it('registration options carry a challenge and rp', async () => {
    const o = await registrationOptions({ rpID: 'acme.com', rpName: 'Acme', userId: 'u-jo', userName: 'jo@acme.com' });
    expect(o.challenge).toBeTruthy();
    expect(o.rp.id).toBe('acme.com');
  });
  it('authentication options carry a challenge', async () => {
    const o = await authenticationOptions({ rpID: 'acme.com' });
    expect(o.challenge).toBeTruthy();
  });
});

const cred: StoredCredential = { id: 'cred-1', publicKey: 'cGs', counter: 0 };

describe('passkey — register orchestration', () => {
  it('stores the credential downstream when verification passes', async () => {
    const res = await passkeyRegisterVerify(
      { downstream: ds(), verifyRegistration: async () => ({ verified: true, credential: cred }) },
      { response: {}, expectedChallenge: 'ch', userId: 'u-jo', origin: 'https://acme.com', rpID: 'acme.com' },
    );
    expect(res).toEqual({ ok: true });
    const found = await ds().passkeysFind({ userId: 'u-jo' });
    expect(found?.credentials.some((c) => c.id === 'cred-1')).toBe(true);
  });
  it('rejects when verification fails', async () => {
    const res = await passkeyRegisterVerify(
      { downstream: ds(), verifyRegistration: async () => ({ verified: false }) },
      { response: {}, expectedChallenge: 'ch', userId: 'u-jo', origin: 'https://acme.com', rpID: 'acme.com' },
    );
    expect(res).toEqual({ ok: false, code: 'invalid_credentials' });
  });
});

describe('passkey — auth orchestration', () => {
  it('mints a session when the credential is found and verifies', async () => {
    await ds().passkeysSave({ userId: 'u-jo', credential: cred }); // seed
    const res = await passkeyAuthVerify(
      { downstream: ds(), verifyAuthentication: async () => ({ verified: true, newCounter: 1 }), signSession },
      { response: { id: 'cred-1' }, expectedChallenge: 'ch', origin: 'https://acme.com', rpID: 'acme.com' },
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect((await verifySession(res.token)).sub).toBe('u-jo');
  });
  it('rejects an unknown credential', async () => {
    const res = await passkeyAuthVerify(
      { downstream: ds(), verifyAuthentication: async () => ({ verified: true }), signSession },
      { response: { id: 'nope' }, expectedChallenge: 'ch', origin: 'https://acme.com', rpID: 'acme.com' },
    );
    expect(res).toEqual({ ok: false, code: 'invalid_credentials' });
  });
  it('rejects when the assertion fails to verify', async () => {
    await ds().passkeysSave({ userId: 'u-jo', credential: cred });
    const res = await passkeyAuthVerify(
      { downstream: ds(), verifyAuthentication: async () => ({ verified: false }), signSession },
      { response: { id: 'cred-1' }, expectedChallenge: 'ch', origin: 'https://acme.com', rpID: 'acme.com' },
    );
    expect(res).toEqual({ ok: false, code: 'invalid_credentials' });
  });
});

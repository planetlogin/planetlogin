// Production key path: a real EdDSA private key (from `keygen`) is loaded from
// PLANETLOGIN_JWT_PRIVATE_KEY, used to sign, and verified via the published JWKS —
// exactly what a downstream service does. (Default tests use an ephemeral key.)
import { describe, it, expect, beforeAll } from 'vitest';

const PEM = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEIBYIqdXJaRMbthnIC0+PlJoFw5/bWhG7t4eI28QOR+6X
-----END PRIVATE KEY-----
`;

let jwt: typeof import('../src/jwt.ts');
beforeAll(async () => {
  process.env.PLANETLOGIN_JWT_PRIVATE_KEY = PEM;
  process.env.PLANETLOGIN_JWT_KID = 'k1';
  jwt = await import('../src/jwt.ts'); // fresh module → getKeys reads the env key
});

describe('jwt — production key from env', () => {
  it('signs a session with the env key and verifies it via JWKS', async () => {
    const token = await jwt.signSession({ sub: 'u1', email: 'a@b.c' });
    const claims = await jwt.verifySession(token);
    expect(claims.sub).toBe('u1');
    expect(claims.email).toBe('a@b.c');
  });
  it('publishes the matching public key (stable kid) in the JWKS', async () => {
    const set = await jwt.jwks();
    expect(set.keys).toHaveLength(1);
    expect(set.keys[0].kid).toBe('k1');
    expect(set.keys[0].crv).toBe('Ed25519');
    expect((set.keys[0] as any).d).toBeUndefined(); // never leak the private scalar
  });
});

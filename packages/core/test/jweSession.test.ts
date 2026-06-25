// Optional JWE encryption of the session token (nested JWS-in-JWE). With it on,
// the token is opaque (claims unreadable without the JWE key) yet still verifies —
// because the inner signature is preserved. Verifies round-trip, opacity, and that
// a wrong JWE key fails.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { decodeJwt } from 'jose';

const B64URL_KEY_A = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEA'; // 32 bytes
const B64URL_KEY_B = 'QkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkE'; // 32 bytes, different

async function freshJwt(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) process.env[k] = v;
  return import('../src/jwt.ts');
}
const clear = () => {
  for (const k of ['PLANETLOGIN_JWT_ENCRYPT', 'PLANETLOGIN_JWE_KEY', 'PLANETLOGIN_JWT_ALG', 'PLANETLOGIN_JWT_PRIVATE_KEY', 'PLANETLOGIN_JWT_SECRET', 'PLANETLOGIN_JWT_KID']) delete process.env[k];
};
afterEach(clear);

describe('JWE session encryption', () => {
  it('round-trips: encrypted token verifies back to the claims', async () => {
    const jwt = await freshJwt({ PLANETLOGIN_JWT_ENCRYPT: 'true', PLANETLOGIN_JWE_KEY: B64URL_KEY_A });
    const token = await jwt.signSession({ sub: 'u1', email: 'a@b.c' });
    expect(token.split('.').length).toBe(5); // JWE compact = 5 segments
    const claims = await jwt.verifySession(token);
    expect(claims.sub).toBe('u1');
    expect(claims.email).toBe('a@b.c');
  });

  it('is opaque: claims are NOT readable without the key', async () => {
    const jwt = await freshJwt({ PLANETLOGIN_JWT_ENCRYPT: 'true', PLANETLOGIN_JWE_KEY: B64URL_KEY_A });
    const token = await jwt.signSession({ sub: 'secret-user', email: 'private@x.com' });
    // A plain JWT decode (no key) must NOT surface the claims — it's encrypted.
    expect(() => decodeJwt(token)).toThrow();
    expect(token).not.toContain('private');
  });

  it('a different JWE key cannot decrypt/verify', async () => {
    const a = await freshJwt({ PLANETLOGIN_JWT_ENCRYPT: 'true', PLANETLOGIN_JWE_KEY: B64URL_KEY_A });
    const token = await a.signSession({ sub: 'u1' });
    const b = await freshJwt({ PLANETLOGIN_JWT_ENCRYPT: 'true', PLANETLOGIN_JWE_KEY: B64URL_KEY_B });
    await expect(b.verifySession(token)).rejects.toThrow();
  });

  it('off by default → plain JWS (3 segments), still verifies', async () => {
    const jwt = await freshJwt({ PLANETLOGIN_JWE_KEY: B64URL_KEY_A }); // ENCRYPT not set
    const token = await jwt.signSession({ sub: 'u1' });
    expect(token.split('.').length).toBe(3);
    expect((await jwt.verifySession(token)).sub).toBe('u1');
  });

  it('rejects a JWE key that is not 32 bytes', async () => {
    const jwt = await freshJwt({ PLANETLOGIN_JWT_ENCRYPT: 'true', PLANETLOGIN_JWE_KEY: 'c2hvcnQ' }); // "short"
    await expect(jwt.signSession({ sub: 'u1' })).rejects.toThrow(/32 bytes/);
  });
});

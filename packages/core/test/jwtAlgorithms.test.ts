// token.algorithm is all-terrain: EdDSA (default), RS256, ES256 (asymmetric →
// JWKS) and HS256 (symmetric → shared secret, JWKS stays empty). getKeys() caches
// per module load, so each algorithm is exercised in a freshly imported module
// with its own env (vitest isolates module registries per test file, but not per
// test — so we reset modules explicitly).
import { describe, it, expect, vi, afterEach } from 'vitest';

async function freshJwt(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) process.env[k] = v;
  return import('../src/jwt.ts');
}

const clear = () => {
  for (const k of ['PLANETLOGIN_JWT_ALG', 'PLANETLOGIN_JWT_SECRET', 'PLANETLOGIN_JWT_PRIVATE_KEY', 'PLANETLOGIN_JWT_KID']) delete process.env[k];
};
afterEach(clear);

describe('jwt — algorithm all-terrain', () => {
  it('HS256: signs with a shared secret and verifies; JWKS is empty', async () => {
    const jwt = await freshJwt({ PLANETLOGIN_JWT_ALG: 'HS256', PLANETLOGIN_JWT_SECRET: 'super-secret-shared-key-123' });
    const token = await jwt.signSession({ sub: 'u1', email: 'a@b.c' });
    expect(token.split('.').length).toBe(3);
    const claims = await jwt.verifySession(token);
    expect(claims.sub).toBe('u1');
    const set = await jwt.jwks();
    expect(set.keys).toHaveLength(0); // never publish the symmetric secret
  });

  it('HS256: a token signed with a different secret fails to verify', async () => {
    const a = await freshJwt({ PLANETLOGIN_JWT_ALG: 'HS256', PLANETLOGIN_JWT_SECRET: 'secret-A-aaaaaaaaaaaaaaaaaaaa' });
    const token = await a.signSession({ sub: 'u1' });
    const b = await freshJwt({ PLANETLOGIN_JWT_ALG: 'HS256', PLANETLOGIN_JWT_SECRET: 'secret-B-bbbbbbbbbbbbbbbbbbbb' });
    await expect(b.verifySession(token)).rejects.toThrow();
  });

  it('ES256: ephemeral keypair signs, verifies via JWKS, publishes EC public key', async () => {
    const jwt = await freshJwt({ PLANETLOGIN_JWT_ALG: 'ES256', PLANETLOGIN_JWT_KID: 'ec1' });
    const token = await jwt.signSession({ sub: 'u2' });
    const claims = await jwt.verifySession(token);
    expect(claims.sub).toBe('u2');
    const set = await jwt.jwks();
    expect(set.keys[0].kty).toBe('EC');
    expect(set.keys[0].kid).toBe('ec1');
    expect((set.keys[0] as any).d).toBeUndefined();
  });

  it('rejects an unknown algorithm', async () => {
    const jwt = await freshJwt({ PLANETLOGIN_JWT_ALG: 'none' });
    await expect(jwt.signSession({ sub: 'u' })).rejects.toThrow(/Unsupported/);
  });

  it('magic tokens round-trip under HS256', async () => {
    const jwt = await freshJwt({ PLANETLOGIN_JWT_ALG: 'HS256', PLANETLOGIN_JWT_SECRET: 'magic-secret-key-0123456789' });
    const tok = await jwt.signMagicToken('user@x.com');
    const m = await jwt.verifyMagicToken(tok);
    expect(m?.identifier).toBe('user@x.com');
    expect(typeof m?.jti).toBe('string');
  });
});

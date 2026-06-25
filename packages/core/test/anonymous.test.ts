// Anonymous/guest sessions — the no-account, no-downstream path. Mints a signed
// session (anon:true) carrying the picked locale, verifiable via the same JWKS.
import { describe, it, expect } from 'vitest';
import { createAnonymousSession } from '../src/flows/anonymous.ts';
import { signSession, verifySession } from '../src/jwt.ts';

describe('anonymous session', () => {
  it('mints a verifiable session with anon:true and a random sub — no downstream', async () => {
    const r = await createAnonymousSession({ signSession }, { locale: { language: 'es', timezone: 'Europe/Madrid', country: 'ES' } });
    expect(r.user.anon).toBe(true);
    expect(r.user.id).toMatch(/^anon_/);
    const claims = await verifySession(r.token);
    expect(claims.anon).toBe(true);
    expect(claims.sub).toBe(r.user.id);
    expect((claims.locale as any).language).toBe('es');
  });

  it('two calls produce distinct identities', async () => {
    const a = await createAnonymousSession({ signSession });
    const b = await createAnonymousSession({ signSession });
    expect(a.user.id).not.toBe(b.user.id);
  });

  it('a normal (non-anon) session carries no anon claim', async () => {
    const claims = await verifySession(await signSession({ sub: 'u1', email: 'a@b.c' }));
    expect(claims.anon).toBeUndefined();
  });

  it('honors a short ttl', async () => {
    const r = await createAnonymousSession({ signSession }, { ttlSeconds: 60 });
    const claims = await verifySession(r.token);
    expect((claims.exp as number) - (claims.iat as number)).toBe(60);
  });
});

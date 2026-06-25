// Anonymous / guest session (spec §3 /auth/anonymous). The EASIEST PlanetLogin:
// no account, no password, no downstream — mint a signed session for a fresh
// random identity, carrying the picked locale. The globe → a signed locale token,
// zero backend storage. Verifiable offline via JWKS like any session.
//
// ⚠️ This is a SESSION identity, not authentication of a person: no credential was
// verified. The token carries `anon: true` so consumers can refuse it for anything
// sensitive. Upgrade path: later bind this `sub` to a real account (email/OAuth/
// password) — that step DOES use the downstream.
import type { Locale, SessionClaims } from '../jwt.ts';

export interface AnonymousDeps {
  signSession: (claims: SessionClaims, opts?: { issuer?: string; audience?: string; ttlSeconds?: number }) => Promise<string>;
}

export interface AnonymousInput {
  locale?: Locale;
  ttlSeconds?: number;
  issuer?: string;
  audience?: string;
}

export interface AnonymousResult {
  token: string;
  user: { id: string; anon: true };
}

/** Mint an anonymous session. The `sub` is a fresh random id (prefixed `anon_`). */
export async function createAnonymousSession(deps: AnonymousDeps, input: AnonymousInput = {}): Promise<AnonymousResult> {
  const id = `anon_${crypto.randomUUID()}`;
  const token = await deps.signSession(
    { sub: id, locale: input.locale, anon: true },
    { issuer: input.issuer, audience: input.audience, ttlSeconds: input.ttlSeconds },
  );
  return { token, user: { id, anon: true } };
}

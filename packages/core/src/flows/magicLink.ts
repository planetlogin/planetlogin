// Magic-link flow (spec §3 /auth/magic/*). Passwordless: issue a signed,
// short-lived token, the integrator delivers it; verifying it mints a session.
// No enumeration: /request ALWAYS reports accepted, whether the account exists or
// not. Stateless: the token carries everything; nothing is stored here.
import type { Downstream } from '../downstream.ts';
import type { Locale, SessionClaims } from '../jwt.ts';
import type { SessionStore } from '../store.ts';

export interface MagicRequestDeps {
  downstream: Downstream;
  signMagicToken: (identifier: string) => Promise<string>;
}

export interface MagicVerifyDeps {
  downstream: Downstream;
  verifyMagicToken: (token: string) => Promise<{ identifier: string; jti: string } | null>;
  signSession: (claims: SessionClaims) => Promise<string>;
  // Optional store → true single-use. With the default NoneStore, claimOnce
  // always allows, so single-use degrades to the token's short TTL.
  store: SessionStore;
}

/** Always resolves `{ accepted: true }` (the route returns 202) — no enumeration. */
export async function requestMagicLink(
  deps: MagicRequestDeps,
  input: { identifier: string; baseUrl: string; locale?: Locale },
): Promise<{ accepted: true }> {
  try {
    // Only deliver to real accounts, but never reveal whether one exists.
    const user = await deps.downstream.findUser(input.identifier);
    if (user) {
      const token = await deps.signMagicToken(input.identifier);
      const link = `${input.baseUrl.replace(/\/$/, '')}/auth/magic/verify?token=${encodeURIComponent(token)}`;
      await deps.downstream.deliverMagic({ identifier: input.identifier, link, locale: input.locale });
    }
  } catch {
    // Swallow — still report accepted (no signal either way).
  }
  return { accepted: true };
}

export type MagicVerifyResult =
  | { ok: true; token: string; user: { id: string; email?: string; name?: string } }
  | { ok: false; code: 'invalid_token' };

export async function verifyMagicLink(
  deps: MagicVerifyDeps,
  input: { token: string; locale?: Locale },
): Promise<MagicVerifyResult> {
  const m = await deps.verifyMagicToken(input.token);
  if (!m) return { ok: false, code: 'invalid_token' };

  // True single-use when a store is configured: claim the jti once. With the
  // default NoneStore this always allows (single-use bounded by TTL only).
  const fresh = await deps.store.claimOnce(`magic:${m.jti}`, 900);
  if (!fresh) return { ok: false, code: 'invalid_token' };

  const user = await deps.downstream.findUser(m.identifier).catch(() => null);
  if (!user) return { ok: false, code: 'invalid_token' };

  const session = await deps.signSession({
    sub: user.id, email: user.email, name: user.name, locale: input.locale ?? user.locale,
  });
  return { ok: true, token: session, user: { id: user.id, email: user.email, name: user.name } };
}

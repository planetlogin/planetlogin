import type { DownstreamStore } from '../downstream.ts';
import type { Locale, SessionClaims } from '../jwt.ts';
import type { SessionStore } from '../store.ts';

export interface PasswordResetRequestDeps {
  downstream: DownstreamStore;
  signResetToken: (userId: string, email: string) => Promise<string>;
  deliverReset: (data: { email: string; link: string; locale?: Locale }) => Promise<unknown>;
}

export async function requestPasswordReset(
  deps: PasswordResetRequestDeps,
  input: { identifier: string; baseUrl: string; locale?: Locale },
): Promise<{ accepted: true }> {
  try {
    const user = await deps.downstream.findUser(input.identifier);
    if (user && user.email) {
      const token = await deps.signResetToken(user.id, user.email);
      const link = `${input.baseUrl.replace(/\/$/, '')}/reset?token=${encodeURIComponent(token)}`;
      await deps.deliverReset({ email: user.email, link, locale: input.locale });
    }
  } catch {}
  return { accepted: true };
}

export interface PasswordResetVerifyDeps {
  downstream: DownstreamStore;
  verifyResetToken: (token: string) => Promise<{ userId: string; email: string; jti: string } | null>;
  signSession: (claims: SessionClaims) => Promise<string>;
  store: SessionStore;
}

export type PasswordResetResult =
  | { ok: true; token: string; user: { id: string; email?: string; name?: string } }
  | { ok: false; code: 'invalid_token' | 'downstream_unavailable' };

export async function verifyPasswordReset(
  deps: PasswordResetVerifyDeps,
  input: { token: string; password: string; locale?: Locale },
): Promise<PasswordResetResult> {
  const m = await deps.verifyResetToken(input.token);
  if (!m) return { ok: false, code: 'invalid_token' };

  const fresh = await deps.store.claimOnce(`reset:${m.jti}`, 3600);
  if (!fresh) return { ok: false, code: 'invalid_token' };

  try {
    await deps.downstream.updatePassword({ userId: m.userId, password: input.password });
  } catch {
    return { ok: false, code: 'downstream_unavailable' };
  }

  const user = await deps.downstream.findUser(m.email).catch(() => null);
  if (!user) return { ok: false, code: 'downstream_unavailable' };

  const session = await deps.signSession({
    sub: user.id, email: user.email, name: user.name, locale: input.locale ?? user.locale,
  });
  return { ok: true, token: session, user: { id: user.id, email: user.email, name: user.name } };
}

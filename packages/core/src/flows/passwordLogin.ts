// The password login flow (spec §3 /auth/password/login). Pure orchestration with
// injected deps → fully testable. No storage, no enumeration, fail-closed.
import type { DownstreamStore } from '../downstream.ts';
import type { Locale, SessionClaims } from '../jwt.ts';

export interface PasswordLoginDeps {
  downstream: DownstreamStore;
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  signSession: (claims: SessionClaims) => Promise<string>;
}

export interface PasswordLoginInput {
  identifier: string;
  password: string;
  locale?: Locale;
}

export type PasswordLoginResult =
  | { ok: true; token: string; user: { id: string; email?: string; name?: string } }
  | { ok: 'mfa'; userId: string } // password correct, but a 2FA step is required
  | { ok: false; code: 'invalid_credentials' | 'downstream_unavailable' };

export async function passwordLogin(
  deps: PasswordLoginDeps,
  input: PasswordLoginInput,
): Promise<PasswordLoginResult> {
  let user;
  try {
    user = await deps.downstream.findUser(input.identifier);
  } catch {
    // Fail closed: if we can't reach the store, deny (never assume success).
    return { ok: false, code: 'downstream_unavailable' };
  }

  // No account, or account has no password credential → identical error.
  // (No account enumeration: same response whether the user exists or not.)
  if (!user || !user.passwordHash) {
    return { ok: false, code: 'invalid_credentials' };
  }

  const valid = await deps.verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    return { ok: false, code: 'invalid_credentials' };
  }

  // Password is correct — if 2FA is on, hand off to the TOTP step instead of a session.
  if (user.totpEnabled) {
    return { ok: 'mfa', userId: user.id };
  }

  const token = await deps.signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    locale: input.locale ?? user.locale,
  });
  return { ok: true, token, user: { id: user.id, email: user.email, name: user.name } };
}

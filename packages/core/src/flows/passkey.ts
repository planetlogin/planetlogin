// Passkey ceremonies orchestration (spec §3 /auth/passkey/*). The WebAuthn crypto
// is delegated to the wrapper (verify* injected → testable); here we only route to
// the downstream credential store and mint a session. Nothing stored locally.
import type { DownstreamStore } from '../downstream.ts';
import type { Locale, SessionClaims } from '../jwt.ts';
import type { StoredCredential } from '../passkey.ts';

export interface RegisterVerifyDeps {
  downstream: DownstreamStore;
  verifyRegistration: (a: { response: any; expectedChallenge: string; origin: string; rpID: string }) => Promise<{ verified: boolean; credential?: StoredCredential }>;
}
export interface AuthVerifyDeps {
  downstream: DownstreamStore;
  verifyAuthentication: (a: { response: any; expectedChallenge: string; origin: string; rpID: string; credential: StoredCredential }) => Promise<{ verified: boolean; newCounter?: number }>;
  signSession: (claims: SessionClaims) => Promise<string>;
}

export type RegisterResult = { ok: true } | { ok: false; code: 'invalid_credentials' };
export type AuthResult =
  | { ok: true; token: string; user: { id: string } }
  | { ok: false; code: 'invalid_credentials' };

export async function passkeyRegisterVerify(
  deps: RegisterVerifyDeps,
  input: { response: any; expectedChallenge: string; userId: string; origin: string; rpID: string },
): Promise<RegisterResult> {
  const v = await deps.verifyRegistration({
    response: input.response, expectedChallenge: input.expectedChallenge, origin: input.origin, rpID: input.rpID,
  }).catch(() => ({ verified: false } as const));
  if (!v.verified || !v.credential) return { ok: false, code: 'invalid_credentials' };
  await deps.downstream.passkeysSave({ userId: input.userId, credential: v.credential });
  return { ok: true };
}

export async function passkeyAuthVerify(
  deps: AuthVerifyDeps,
  input: { response: any; expectedChallenge: string; origin: string; rpID: string; locale?: Locale },
): Promise<AuthResult> {
  const credentialId = input.response?.id as string | undefined;
  if (!credentialId) return { ok: false, code: 'invalid_credentials' };

  const found = await deps.downstream.passkeysFind({ credentialId }).catch(() => null);
  const credential = found?.credentials?.find((c) => c.id === credentialId) as StoredCredential | undefined;
  if (!found || !credential) return { ok: false, code: 'invalid_credentials' };

  const v = await deps.verifyAuthentication({
    response: input.response, expectedChallenge: input.expectedChallenge, origin: input.origin, rpID: input.rpID, credential,
  }).catch(() => ({ verified: false } as const));
  if (!v.verified) return { ok: false, code: 'invalid_credentials' };

  // Update the signature counter downstream (clone detection) — best effort.
  if (typeof v.newCounter === 'number') {
    await deps.downstream.passkeysSave({ userId: found.userId, credential: { ...credential, counter: v.newCounter } }).catch(() => {});
  }

  const token = await deps.signSession({ sub: found.userId, locale: input.locale });
  return { ok: true, token, user: { id: found.userId } };
}

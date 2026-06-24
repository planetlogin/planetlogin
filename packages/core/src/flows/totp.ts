// TOTP (2FA) flows (spec §3 /auth/totp/*). Enroll generates a secret + otpauth URI
// (the integrator stores the secret); verify checks a code and, on first success,
// confirms enrollment (enabled=true). Pure orchestration; secret lives downstream.
import type { Downstream } from '../downstream.ts';
import { newTotpSecret, totpKeyUri, verifyTotp } from '../totp.ts';

export interface TotpDeps { downstream: Downstream }

export async function totpEnroll(
  deps: TotpDeps,
  input: { userId: string; label: string; issuer?: string },
): Promise<{ secret: string; uri: string }> {
  const secret = newTotpSecret();
  await deps.downstream.totpSave({ userId: input.userId, secret, enabled: false });
  return { secret, uri: totpKeyUri(secret, input.label, input.issuer) };
}

/** Verify a code. On first success for a not-yet-enabled secret, enable it
 *  (confirms enrollment). Returns ok=false on any failure. */
export async function totpVerify(
  deps: TotpDeps,
  input: { userId: string; code: string },
): Promise<{ ok: boolean }> {
  const rec = await deps.downstream.totpGet({ userId: input.userId }).catch(() => null);
  if (!rec?.secret) return { ok: false };
  if (!verifyTotp(rec.secret, input.code)) return { ok: false };
  if (!rec.enabled) await deps.downstream.totpSave({ userId: input.userId, secret: rec.secret, enabled: true });
  return { ok: true };
}

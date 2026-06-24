// TOTP (2FA) — RFC 6238 via otpauth (pure JS, audited). Secrets live downstream;
// PlanetLogin only generates, builds the otpauth:// URI (for the QR), and verifies.
import { TOTP, Secret } from 'otpauth';

function build(secretB32: string, label = 'user', issuer = 'PlanetLogin'): TOTP {
  return new TOTP({ issuer, label, algorithm: 'SHA1', digits: 6, period: 30, secret: Secret.fromBase32(secretB32) });
}

export function newTotpSecret(): string {
  return new Secret({ size: 20 }).base32;
}

export function totpKeyUri(secretB32: string, label: string, issuer = 'PlanetLogin'): string {
  return build(secretB32, label, issuer).toString();
}

/** Verify a 6-digit code (±1 step window for clock skew). Never throws. */
export function verifyTotp(secretB32: string, code: string): boolean {
  try {
    return build(secretB32).validate({ token: String(code).trim(), window: 1 }) !== null;
  } catch {
    return false;
  }
}

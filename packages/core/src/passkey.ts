// Passkeys / WebAuthn — thin wrapper over @simplewebauthn/server (v13). WebAuthn
// verification (CBOR, COSE keys, attestation, signature checks) is exactly where
// you MUST NOT hand-roll; the library does it. We only orchestrate + store the
// credential downstream. Stored public keys are base64url strings.
import {
  generateRegistrationOptions, verifyRegistrationResponse,
  generateAuthenticationOptions, verifyAuthenticationResponse,
} from '@simplewebauthn/server';

export interface StoredCredential {
  id: string;          // credential id (base64url)
  publicKey: string;   // COSE public key (base64url)
  counter: number;
  transports?: string[];
}

const b64u = { enc: (b: Uint8Array) => Buffer.from(b).toString('base64url'), dec: (s: string) => new Uint8Array(Buffer.from(s, 'base64url')) };

export function registrationOptions(a: { rpID: string; rpName: string; userId: string; userName: string; existing?: StoredCredential[] }) {
  return generateRegistrationOptions({
    rpName: a.rpName, rpID: a.rpID,
    userID: new TextEncoder().encode(a.userId), userName: a.userName,
    attestationType: 'none',
    excludeCredentials: (a.existing ?? []).map((c) => ({ id: c.id, transports: c.transports as any })),
    authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
  });
}

export function authenticationOptions(a: { rpID: string; allow?: StoredCredential[] }) {
  return generateAuthenticationOptions({
    rpID: a.rpID, userVerification: 'preferred',
    allowCredentials: (a.allow ?? []).map((c) => ({ id: c.id, transports: c.transports as any })),
  });
}

export async function verifyRegistration(a: { response: any; expectedChallenge: string; origin: string; rpID: string }): Promise<{ verified: boolean; credential?: StoredCredential }> {
  const v = await verifyRegistrationResponse({
    response: a.response, expectedChallenge: a.expectedChallenge, expectedOrigin: a.origin, expectedRPID: a.rpID,
  });
  if (!v.verified || !v.registrationInfo) return { verified: false };
  const c = v.registrationInfo.credential;
  return { verified: true, credential: { id: c.id, publicKey: b64u.enc(c.publicKey), counter: c.counter, transports: c.transports } };
}

export async function verifyAuthentication(a: { response: any; expectedChallenge: string; origin: string; rpID: string; credential: StoredCredential }): Promise<{ verified: boolean; newCounter?: number }> {
  const v = await verifyAuthenticationResponse({
    response: a.response, expectedChallenge: a.expectedChallenge, expectedOrigin: a.origin, expectedRPID: a.rpID,
    credential: { id: a.credential.id, publicKey: b64u.dec(a.credential.publicKey), counter: a.credential.counter, transports: a.credential.transports as any },
  });
  return { verified: v.verified, newCounter: v.authenticationInfo?.newCounter };
}

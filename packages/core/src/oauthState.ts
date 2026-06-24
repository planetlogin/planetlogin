// Stateless OAuth: the `state` + PKCE `code_verifier` survive the redirect inside
// an ENCRYPTED (JWE) HttpOnly cookie — nothing is stored server-side. jose, A256GCM.
import { EncryptJWT, jwtDecrypt, base64url } from 'jose';

export interface OAuthStateData {
  provider: string;
  state: string;
  codeVerifier: string;
  redirectTo: string;
}

let stateKey: Uint8Array | null = null;
function getStateKey(): Uint8Array {
  if (stateKey) return stateKey;
  const env = process.env.PLANETLOGIN_STATE_KEY;
  // Production: a 32-byte base64url key. Dev: an ephemeral key (in-flight flows
  // only survive within one process lifetime, which is fine for dev).
  stateKey = env ? base64url.decode(env) : crypto.getRandomValues(new Uint8Array(32));
  if (stateKey.length !== 32) throw new Error('PLANETLOGIN_STATE_KEY must decode to 32 bytes');
  return stateKey;
}

/** Generic short-lived encrypted (JWE A256GCM) cookie payload — used to keep
 *  OAuth state and WebAuthn challenges across a redirect/ceremony, statelessly. */
export async function sealEnc(data: unknown, ttlSeconds = 600): Promise<string> {
  return new EncryptJWT({ d: data as any })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .encrypt(getStateKey());
}
export async function openEnc<T = any>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtDecrypt(token, getStateKey());
    return (payload as any).d as T;
  } catch {
    return null;
  }
}

export const sealOAuthState = (d: OAuthStateData, ttl = 600) => sealEnc(d, ttl);
export const openOAuthState = (t: string) => openEnc<OAuthStateData>(t);

// Session tokens — asymmetric JWT (EdDSA) so downstream services verify with the
// published JWKS, never with the private key. jose, pure JS (spec §2).
import {
  SignJWT, jwtVerify, exportJWK, generateKeyPair, importPKCS8,
  createLocalJWKSet, type KeyLike, type JWK,
} from 'jose';
import { readFileSync } from 'node:fs';

export interface Locale { language?: string; timezone?: string; country?: string }
export interface SessionClaims {
  sub: string; email?: string; name?: string; locale?: Locale;
}

interface Keys { priv: KeyLike; pubJwk: JWK; kid: string }
let cache: Keys | null = null;

/** PLANETLOGIN_JWT_PRIVATE_KEY is either the PEM itself or a path to a PEM file
 *  (e.g. a Docker/K8s secret). _PEM is kept as a back-compat alias. */
function loadPrivatePem(): string | null {
  const v = process.env.PLANETLOGIN_JWT_PRIVATE_KEY ?? process.env.PLANETLOGIN_JWT_PRIVATE_KEY_PEM;
  if (!v) return null;
  return v.includes('-----BEGIN') ? v : readFileSync(v, 'utf8');
}

async function getKeys(): Promise<Keys> {
  if (cache) return cache;
  let priv: KeyLike;
  const pem = loadPrivatePem();
  if (pem) {
    priv = await importPKCS8(pem, 'EdDSA');
  } else {
    // Dev fallback: ephemeral keypair — tokens die on restart and can't be verified
    // across instances. Production MUST set PLANETLOGIN_JWT_PRIVATE_KEY (run `keygen`).
    console.warn('[planetlogin] WARNING: no PLANETLOGIN_JWT_PRIVATE_KEY — using an EPHEMERAL keypair. Do not use in production.');
    priv = (await generateKeyPair('EdDSA', { extractable: true })).privateKey;
  }
  const full = await exportJWK(priv);
  const { d, ...pub } = full; // strip the private scalar → public JWK
  const kid = process.env.PLANETLOGIN_JWT_KID || 'dev';
  cache = { priv, pubJwk: { ...pub, kid, use: 'sig', alg: 'EdDSA' }, kid };
  return cache;
}

/** Public JWK Set served at GET /auth/.well-known/jwks.json. */
export async function jwks(): Promise<{ keys: JWK[] }> {
  const k = await getKeys();
  return { keys: [k.pubJwk] };
}

export async function signSession(
  claims: SessionClaims,
  opts: { issuer?: string; audience?: string; ttlSeconds?: number } = {},
): Promise<string> {
  const k = await getKeys();
  return new SignJWT({ email: claims.email, name: claims.name, locale: claims.locale })
    .setProtectedHeader({ alg: 'EdDSA', kid: k.kid })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${opts.ttlSeconds ?? 3600}s`)
    .setIssuer(opts.issuer ?? 'planetlogin')
    .setAudience(opts.audience ?? 'planetlogin')
    .sign(k.priv);
}

/** Verify a session token against our own JWKS (what a downstream service does). */
export async function verifySession(token: string) {
  const set = await jwks();
  const keySet = createLocalJWKSet(set as any);
  const { payload } = await jwtVerify(token, keySet, { issuer: 'planetlogin', audience: 'planetlogin' });
  return payload;
}

// ── Magic-link tokens ────────────────────────────────────────────────────────
// Signed (EdDSA) so they can't be forged. Short TTL + a `purpose:magic` claim so
// a magic token can never be replayed as a session token. True single-use needs
// the downstream to track the `jti` (optional); the short TTL is the baseline.
export async function signMagicToken(identifier: string, ttlSeconds = 900): Promise<string> {
  const k = await getKeys();
  return new SignJWT({ purpose: 'magic' })
    .setProtectedHeader({ alg: 'EdDSA', kid: k.kid })
    .setSubject(identifier)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .setIssuer('planetlogin')
    .setAudience('planetlogin:magic')
    .sign(k.priv);
}

/** Returns {identifier, jti} if the token is a valid, unexpired magic token, else null. */
export async function verifyMagicToken(token: string): Promise<{ identifier: string; jti: string } | null> {
  try {
    const set = await jwks();
    const { payload } = await jwtVerify(token, createLocalJWKSet(set as any), {
      issuer: 'planetlogin', audience: 'planetlogin:magic',
    });
    if (payload.purpose !== 'magic' || !payload.sub || !payload.jti) return null;
    return { identifier: payload.sub, jti: payload.jti };
  } catch {
    return null;
  }
}

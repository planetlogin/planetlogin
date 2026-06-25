// Session tokens — JWT. Default is an ASYMMETRIC algorithm (EdDSA) so downstream
// services verify with the published JWKS, never with the private key. The
// algorithm is configurable (spec §2, config.token.algorithm): EdDSA/RS256/ES256
// are asymmetric (JWKS); HS256 is symmetric (shared secret, no public JWKS).
// jose, pure JS.
import {
  SignJWT, jwtVerify, exportJWK, generateKeyPair, generateSecret,
  importPKCS8, createLocalJWKSet, CompactEncrypt, compactDecrypt, base64url,
  type KeyLike, type JWK, type JWTVerifyGetKey,
} from 'jose';
import { readFileSync } from 'node:fs';

export interface Locale {
  language?: string; timezone?: string; country?: string;
  // Optional coordinates of the picked place — needed to replay the globe fly-to
  // on login (Tier 2 account memory). The globe produces them; persisting them is
  // what lets a returning user's globe fly to their saved spot.
  lat?: number; lon?: number;
}
export interface SessionClaims {
  sub: string; email?: string; name?: string; locale?: Locale;
  /** True for an ANONYMOUS/guest session — no credential was verified. It is a
   *  session identity, NOT proof of who the user is. Consumers MUST treat
   *  `anon === true` as unauthenticated for anything sensitive. */
  anon?: boolean;
}

export type JwtAlg = 'EdDSA' | 'RS256' | 'ES256' | 'HS256';
const ASYMMETRIC: JwtAlg[] = ['EdDSA', 'RS256', 'ES256'];

interface Keys {
  alg: JwtAlg;
  kid: string;
  sign: KeyLike | Uint8Array;     // private key (asym) or shared secret (HS256)
  verify: KeyLike | Uint8Array;   // public key (asym) or shared secret (HS256)
  pubJwk: JWK | null;             // null for HS256 → JWKS stays empty
}
let cache: Keys | null = null;

/** The signing algorithm. EdDSA default; override with PLANETLOGIN_JWT_ALG. Must
 *  match config.token.algorithm in your deployment. */
function resolveAlg(): JwtAlg {
  const a = (process.env.PLANETLOGIN_JWT_ALG || 'EdDSA') as JwtAlg;
  if (!ASYMMETRIC.includes(a) && a !== 'HS256') {
    throw new Error(`Unsupported PLANETLOGIN_JWT_ALG "${a}" (use EdDSA|RS256|ES256|HS256)`);
  }
  return a;
}

/** PLANETLOGIN_JWT_PRIVATE_KEY is either the PEM itself or a path to a PEM file
 *  (e.g. a Docker/K8s secret). _PEM is kept as a back-compat alias. */
function loadPrivatePem(): string | null {
  const v = process.env.PLANETLOGIN_JWT_PRIVATE_KEY ?? process.env.PLANETLOGIN_JWT_PRIVATE_KEY_PEM;
  if (!v) return null;
  return v.includes('-----BEGIN') ? v : readFileSync(v, 'utf8');
}

/** HS256 shared secret — PLANETLOGIN_JWT_SECRET (raw string or path to a file). */
function loadSecret(): Uint8Array | null {
  const v = process.env.PLANETLOGIN_JWT_SECRET;
  if (!v) return null;
  const raw = v.includes('\n') || v.length > 256 ? v : (v.startsWith('/') ? readFileSync(v, 'utf8').trim() : v);
  return new TextEncoder().encode(raw);
}

async function getKeys(): Promise<Keys> {
  if (cache) return cache;
  const alg = resolveAlg();
  const kid = process.env.PLANETLOGIN_JWT_KID || 'dev';

  if (alg === 'HS256') {
    let secret = loadSecret();
    if (!secret) {
      console.warn('[planetlogin] WARNING: no PLANETLOGIN_JWT_SECRET — using an EPHEMERAL HS256 secret. Tokens die on restart and cannot be verified across instances. Do not use in production.');
      secret = (await generateSecret('HS256', { extractable: true })) as Uint8Array;
    }
    // Symmetric: the verify key IS the secret. Never publish it → JWKS empty.
    cache = { alg, kid, sign: secret, verify: secret, pubJwk: null };
    return cache;
  }

  // Asymmetric: load the private PEM (or an ephemeral dev keypair) for this curve.
  let priv: KeyLike;
  const pem = loadPrivatePem();
  if (pem) {
    priv = await importPKCS8(pem, alg);
  } else {
    console.warn(`[planetlogin] WARNING: no PLANETLOGIN_JWT_PRIVATE_KEY — using an EPHEMERAL ${alg} keypair. Do not use in production.`);
    priv = (await generateKeyPair(alg, { extractable: true })).privateKey;
  }
  const full = await exportJWK(priv);
  const { d, p, q, dp, dq, qi, ...pub } = full as any; // strip private components → public JWK
  cache = { alg, kid, sign: priv, verify: priv, pubJwk: { ...pub, kid, use: 'sig', alg } };
  return cache;
}

/** Public JWK Set served at GET /auth/.well-known/jwks.json. Empty for HS256
 *  (symmetric secrets are shared out of band, never published). */
export async function jwks(): Promise<{ keys: JWK[] }> {
  const k = await getKeys();
  return { keys: k.pubJwk ? [k.pubJwk] : [] };
}

/** Resolve the key/keyset jose needs to VERIFY a token of our algorithm. */
async function verifier(): Promise<Uint8Array | JWTVerifyGetKey> {
  const k = await getKeys();
  if (k.alg === 'HS256') return k.verify as Uint8Array;
  return createLocalJWKSet({ keys: [k.pubJwk!] });
}

// ── Optional encryption (JWE) of the session token (spec §8) ──────────────────
// When PLANETLOGIN_JWT_ENCRYPT=true the session token is a NESTED JWT: the signed
// JWS is wrapped in a JWE (dir + A256GCM) so the claims are confidential — a
// client/intermediary can't read email/locale/etc. The signature is preserved, so
// a holder of the JWE key DECRYPTS, then verifies the inner JWS via JWKS as usual.
// The JWE key is symmetric and shared out of band (like HS256) — encryption is a
// single-trust-domain feature; it does NOT replace the asymmetric verify model.
let jweKey: Uint8Array | null = null;
function encryptEnabled(): boolean { return process.env.PLANETLOGIN_JWT_ENCRYPT === 'true'; }
function getJweKey(): Uint8Array {
  if (jweKey) return jweKey;
  const env = process.env.PLANETLOGIN_JWE_KEY;
  if (env) {
    jweKey = base64url.decode(env);
    if (jweKey.length !== 32) throw new Error('PLANETLOGIN_JWE_KEY must decode to 32 bytes (base64url)');
  } else {
    console.warn('[planetlogin] WARNING: PLANETLOGIN_JWT_ENCRYPT is on but no PLANETLOGIN_JWE_KEY — using an EPHEMERAL key. Tokens cannot be decrypted across instances/restarts. Do not use in production.');
    jweKey = crypto.getRandomValues(new Uint8Array(32));
  }
  return jweKey;
}
async function maybeEncrypt(jws: string): Promise<string> {
  if (!encryptEnabled()) return jws;
  return new CompactEncrypt(new TextEncoder().encode(jws))
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM', cty: 'JWT' })
    .encrypt(getJweKey());
}
/** A JWE compact token has 5 dot-separated segments; a JWS has 3. */
async function maybeDecrypt(token: string): Promise<string> {
  if (token.split('.').length !== 5) return token;
  const { plaintext } = await compactDecrypt(token, getJweKey());
  return new TextDecoder().decode(plaintext);
}

export async function signSession(
  claims: SessionClaims,
  opts: { issuer?: string; audience?: string; ttlSeconds?: number } = {},
): Promise<string> {
  const k = await getKeys();
  const jws = await new SignJWT({ email: claims.email, name: claims.name, locale: claims.locale, anon: claims.anon })
    .setProtectedHeader({ alg: k.alg, kid: k.kid })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${opts.ttlSeconds ?? 3600}s`)
    .setIssuer(opts.issuer ?? 'planetlogin')
    .setAudience(opts.audience ?? 'planetlogin')
    .sign(k.sign as any);
  return maybeEncrypt(jws);
}

/** Verify a session token against our own key material (what a downstream does).
 *  Transparently decrypts a JWE-wrapped token first when encryption is on. */
export async function verifySession(token: string) {
  const { payload } = await jwtVerify(await maybeDecrypt(token), (await verifier()) as any, {
    issuer: 'planetlogin', audience: 'planetlogin',
  });
  return payload;
}

// ── Magic-link tokens ────────────────────────────────────────────────────────
// Signed so they can't be forged. Short TTL + a `purpose:magic` claim so a magic
// token can never be replayed as a session token. True single-use needs the store
// to track the `jti` (optional); the short TTL is the baseline.
export async function signMagicToken(identifier: string, ttlSeconds = 900): Promise<string> {
  const k = await getKeys();
  return new SignJWT({ purpose: 'magic' })
    .setProtectedHeader({ alg: k.alg, kid: k.kid })
    .setSubject(identifier)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .setIssuer('planetlogin')
    .setAudience('planetlogin:magic')
    .sign(k.sign as any);
}

/** Returns {identifier, jti} if the token is a valid, unexpired magic token, else null. */
export async function verifyMagicToken(token: string): Promise<{ identifier: string; jti: string } | null> {
  try {
    const { payload } = await jwtVerify(token, (await verifier()) as any, {
      issuer: 'planetlogin', audience: 'planetlogin:magic',
    });
    if (payload.purpose !== 'magic' || !payload.sub || !payload.jti) return null;
    return { identifier: payload.sub, jti: payload.jti };
  } catch {
    return null;
  }
}

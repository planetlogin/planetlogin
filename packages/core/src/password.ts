// Password hashing & verification — "all-terrain". New hashes are argon2id, but
// verification AUTO-DETECTS the stored format so PlanetLogin drops in front of an
// existing user store (bcrypt, scrypt, pbkdf2, argon2) without rehashing. All via
// standard, audited primitives — no hand-rolled crypto. Safe envelope: no MD5/SHA1.
import { argon2id, argon2Verify } from 'hash-wasm';
import bcrypt from 'bcryptjs';
import { scrypt as nodeScrypt, pbkdf2 as nodePbkdf2, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(nodeScrypt) as (pw: string, salt: Buffer, keylen: number, opts: any) => Promise<Buffer>;
const pbkdf2Async = promisify(nodePbkdf2) as (pw: string, salt: Buffer, iter: number, keylen: number, digest: string) => Promise<Buffer>;

const PARAMS = { parallelism: 1, iterations: 2, memorySize: 19456, hashLength: 32 } as const; // OWASP argon2id

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return argon2id({ password, salt, ...PARAMS, outputType: 'encoded' });
}

const safeEq = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);

/**
 * Verify a plaintext password against a stored hash of ANY supported format.
 * Detection is by the encoded-hash prefix. Never throws → returns false on any
 * parse/verify failure or unknown/unsafe format (fail closed).
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    if (!stored) return false;

    // argon2id / argon2i / argon2d  ($argon2id$v=19$m=...,t=...,p=...$salt$hash)
    if (stored.startsWith('$argon2')) {
      return await argon2Verify({ password, hash: stored });
    }

    // bcrypt  ($2a$ / $2b$ / $2y$)
    if (/^\$2[aby]\$/.test(stored)) {
      return await bcrypt.compare(password, stored);
    }

    // scrypt PHC  ($scrypt$ln=<N>,r=<r>,p=<p>$<saltB64>$<hashB64>)
    if (stored.startsWith('$scrypt$')) {
      const [, , params, saltB64, hashB64] = stored.split('$');
      const p = Object.fromEntries(params.split(',').map((kv) => kv.split('=')));
      const salt = Buffer.from(saltB64, 'base64');
      const expected = Buffer.from(hashB64, 'base64');
      const N = p.ln ? 2 ** Number(p.ln) : Number(p.N ?? 16384);
      const derived = await scryptAsync(password, salt, expected.length, { N, r: Number(p.r ?? 8), p: Number(p.p ?? 1), maxmem: 256 * N * Number(p.r ?? 8) });
      return safeEq(derived, expected);
    }

    // Django-style pbkdf2  (pbkdf2_sha256$<iter>$<saltRaw>$<hashStdB64>)
    let m = stored.match(/^pbkdf2_(sha\d+)\$(\d+)\$([^$]+)\$(.+)$/);
    if (m) {
      const [, algo, iter, salt, hashB64] = m;
      const expected = Buffer.from(hashB64, 'base64');
      const derived = await pbkdf2Async(password, Buffer.from(salt, 'utf8'), Number(iter), expected.length, algo.replace('sha', 'sha'));
      return safeEq(derived, expected);
    }
    // passlib-style pbkdf2  ($pbkdf2-sha256$<rounds>$<saltB64>$<hashB64>)
    m = stored.match(/^\$pbkdf2-(sha\d+)\$(\d+)\$([^$]+)\$(.+)$/);
    if (m) {
      const [, algo, iter, saltB64, hashB64] = m;
      const salt = Buffer.from(saltB64.replace(/\./g, '+'), 'base64');
      const expected = Buffer.from(hashB64.replace(/\./g, '+'), 'base64');
      const derived = await pbkdf2Async(password, salt, Number(iter), expected.length, algo);
      return safeEq(derived, expected);
    }

    return false; // unknown / unsupported / unsafe format
  } catch {
    return false;
  }
}

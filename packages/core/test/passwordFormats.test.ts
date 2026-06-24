// "All-terrain" password verification: a stored hash in any common format is
// auto-detected and verified — so PlanetLogin sits in front of an existing user
// store without rehashing. Each format is generated with its standard primitive,
// then verified through the single dispatcher.
import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import { scryptSync, pbkdf2Sync, randomBytes } from 'node:crypto';
import { hashPassword, verifyPassword } from '../src/index.ts';

const PW = 'correct horse battery staple';

function makeScrypt(pw: string): string {
  const ln = 14, r = 8, p = 1, N = 2 ** ln;
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 32, { N, r, p, maxmem: 256 * N * r });
  return `$scrypt$ln=${ln},r=${r},p=${p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}
function makeDjangoPbkdf2(pw: string): string {
  const iter = 120000;
  const salt = randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  const hash = pbkdf2Sync(pw, Buffer.from(salt, 'utf8'), iter, 32, 'sha256');
  return `pbkdf2_sha256$${iter}$${salt}$${hash.toString('base64')}`;
}

describe('verifyPassword — all-terrain format detection', () => {
  it('argon2id (the native format)', async () => {
    const h = await hashPassword(PW);
    expect(h.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(PW, h)).toBe(true);
    expect(await verifyPassword('nope', h)).toBe(false);
  });

  it('bcrypt ($2b$)', async () => {
    const h = bcrypt.hashSync(PW, 10);
    expect(/^\$2[aby]\$/.test(h)).toBe(true);
    expect(await verifyPassword(PW, h)).toBe(true);
    expect(await verifyPassword('nope', h)).toBe(false);
  });

  it('scrypt (PHC $scrypt$)', async () => {
    const h = makeScrypt(PW);
    expect(await verifyPassword(PW, h)).toBe(true);
    expect(await verifyPassword('nope', h)).toBe(false);
  });

  it('pbkdf2 (Django pbkdf2_sha256$)', async () => {
    const h = makeDjangoPbkdf2(PW);
    expect(await verifyPassword(PW, h)).toBe(true);
    expect(await verifyPassword('nope', h)).toBe(false);
  });

  it('fails closed on unknown / unsafe formats', async () => {
    expect(await verifyPassword(PW, 'plaintext')).toBe(false);
    expect(await verifyPassword(PW, '$md5$deadbeef')).toBe(false);
    expect(await verifyPassword(PW, '')).toBe(false);
  });
});

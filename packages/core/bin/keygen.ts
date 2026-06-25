#!/usr/bin/env node
// Generate keys for PlanetLogin.
//   npx planetlogin-keygen            → EdDSA signing keypair (PEM + env line)
//   npx planetlogin-keygen ./key.pem  → also write the private key to a file
//   npx planetlogin-keygen --jwe      → a 32-byte JWE key (for token.encrypt)
import { generateKeyPair, exportPKCS8, exportJWK, base64url } from 'jose';
import { writeFileSync } from 'node:fs';

// JWE key mode: a 32-byte symmetric key (base64url) for encrypting session tokens.
if (process.argv.includes('--jwe')) {
  const key = base64url.encode(crypto.getRandomValues(new Uint8Array(32)));
  process.stdout.write(key + '\n');
  console.error('\n# ↑ 32-byte JWE key (base64url). Shared out of band with services that read claims. Then set:');
  console.error('#   PLANETLOGIN_JWT_ENCRYPT=true');
  console.error(`#   PLANETLOGIN_JWE_KEY=${key}`);
  process.exit(0);
}

const { privateKey, publicKey } = await generateKeyPair('EdDSA', { extractable: true });
const pem = await exportPKCS8(privateKey);
const pubJwk = await exportJWK(publicKey);

const out = process.argv[2];
if (out) {
  writeFileSync(out, pem, { mode: 0o600 });
  console.error(`Private key written to ${out} (chmod 600).`);
  console.error(`\nSet:  PLANETLOGIN_JWT_PRIVATE_KEY=${out}`);
} else {
  process.stdout.write(pem);
  console.error('\n# ↑ EdDSA private key (PEM). Keep it secret. Then set one of:');
  console.error('#   PLANETLOGIN_JWT_PRIVATE_KEY=/path/to/this/key.pem   (recommended: a secret file)');
  console.error('#   PLANETLOGIN_JWT_PRIVATE_KEY="$(cat key.pem)"        (inline)');
}
console.error(`\n# Public key (the kid in your JWKS will be PLANETLOGIN_JWT_KID, default "dev"):`);
console.error('# ' + JSON.stringify({ ...pubJwk, use: 'sig', alg: 'EdDSA' }));

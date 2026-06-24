#!/usr/bin/env node
// Generate an EdDSA (Ed25519) keypair for PlanetLogin session signing.
//   npx planetlogin-keygen            → print PEM + the env line
//   npx planetlogin-keygen ./key.pem  → also write the private key to a file
import { generateKeyPair, exportPKCS8, exportJWK } from 'jose';
import { writeFileSync } from 'node:fs';

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

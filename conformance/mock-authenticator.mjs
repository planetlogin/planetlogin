// A virtual WebAuthn authenticator for the conformance suite. Pure Node crypto —
// generates an ES256 (P-256) credential and produces registration/authentication
// responses that `@simplewebauthn/server` (what the flavor verifies with) accepts.
// Lets the passkey ceremonies be exercised black-box, no browser/hardware.
import { createHash, generateKeyPairSync, sign, randomBytes } from 'node:crypto';

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const fromB64url = (s) => Buffer.from(s, 'base64url');
const sha256 = (buf) => createHash('sha256').update(buf).digest();
const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16BE(n); return b; };

// --- minimal CBOR encoder (only the shapes we emit) ---
const cborUint = (n) => (n <= 23 ? Buffer.from([n]) : Buffer.from([0x18, n]));
const cborNint = (n) => { const m = -n - 1; return Buffer.from([0x20 | m]); }; // only -1..-24
const cborBytes = (buf) => Buffer.concat([buf.length <= 23 ? Buffer.from([0x40 | buf.length]) : Buffer.from([0x58, buf.length]), buf]);
const cborText = (s) => { const b = Buffer.from(s, 'utf8'); return Buffer.concat([Buffer.from([0x60 | b.length]), b]); };
const cborMap = (pairs) => Buffer.concat([Buffer.from([0xa0 | pairs.length]), ...pairs.map(([k, v]) => Buffer.concat([k, v]))]);

// COSE_Key for an EC2 / P-256 / ES256 public key.
const coseKey = (x, y) => cborMap([
  [cborUint(1), cborUint(2)],    // kty: EC2
  [cborUint(3), cborNint(-7)],   // alg: ES256
  [cborNint(-1), cborUint(1)],   // crv: P-256
  [cborNint(-2), cborBytes(x)],  // x
  [cborNint(-3), cborBytes(y)],  // y
]);

const authData = (rpID, flags, counter, attested) => {
  const c = Buffer.alloc(4); c.writeUInt32BE(counter >>> 0);
  return Buffer.concat([sha256(Buffer.from(rpID, 'utf8')), Buffer.from([flags]), c, attested ?? Buffer.alloc(0)]);
};

/** A fresh virtual authenticator holding one ES256 credential. */
export function makeAuthenticator() {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const jwk = publicKey.export({ format: 'jwk' });
  const x = fromB64url(jwk.x), y = fromB64url(jwk.y);
  const credId = randomBytes(16);
  let counter = 0;

  const clientData = (type, challenge, origin) =>
    Buffer.from(JSON.stringify({ type, challenge, origin, crossOrigin: false }), 'utf8');

  return {
    credentialId: b64url(credId),

    // A `navigator.credentials.create()` result for these options.
    register(options, { origin, rpID }) {
      const cdj = clientData('webauthn.create', options.challenge, origin);
      const attestedCredData = Buffer.concat([Buffer.alloc(16), u16(credId.length), credId, coseKey(x, y)]);
      const ad = authData(rpID, 0x45, 0, attestedCredData); // UP | UV | AT
      const attObj = cborMap([
        [cborText('fmt'), cborText('none')],
        [cborText('attStmt'), cborMap([])],
        [cborText('authData'), cborBytes(ad)],
      ]);
      return {
        id: b64url(credId), rawId: b64url(credId), type: 'public-key',
        response: { clientDataJSON: b64url(cdj), attestationObject: b64url(attObj), transports: ['internal'] },
        clientExtensionResults: {}, authenticatorAttachment: 'platform',
      };
    },

    // A `navigator.credentials.get()` result for these options (signed assertion).
    authenticate(options, { origin, rpID }) {
      counter += 1;
      const cdj = clientData('webauthn.get', options.challenge, origin);
      const ad = authData(rpID, 0x05, counter, null); // UP | UV
      const signature = sign('sha256', Buffer.concat([ad, sha256(cdj)]), privateKey); // DER ECDSA
      return {
        id: b64url(credId), rawId: b64url(credId), type: 'public-key',
        response: { clientDataJSON: b64url(cdj), authenticatorData: b64url(ad), signature: b64url(signature) },
        clientExtensionResults: {},
      };
    },
  };
}

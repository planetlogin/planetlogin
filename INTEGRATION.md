# Integrating PlanetLogin

PlanetLogin is a stateless **login portal**: it authenticates, issues a signed JWT,
and forgets. Your app does two things — **persist** (implement the §4 downstream) and
**verify** (check the issued token via the published JWKS). Nothing else.

```
 Browser ──▶ PlanetLogin portal ──(§4 REST)──▶ your downstream store
    ▲                │  issues EdDSA JWT
    │  cookie/token  ▼
 your app ◀── verifies the JWT via the portal's JWKS  (offline, no shared secret)
```

## 1. Generate a signing key
```bash
npx planetlogin-keygen ./pl_ed25519.pem      # writes the EdDSA private key (chmod 600)
```

## 2. Run a downstream (your persistence)
Implement the seven §4 routes — see [`examples/downstream`](examples/downstream) for a
real, copyable SQLite implementation. Point the portal at it.

## 3. Run the portal (a flavor)
```bash
PLANETLOGIN_BASE_URL=https://login.acme.com \
PLANETLOGIN_CONFIG=./planetlogin.config.json \
PLANETLOGIN_JWT_PRIVATE_KEY=./pl_ed25519.pem \
PLANETLOGIN_DOWNSTREAM_URL=https://api.acme.com/identity \
PLANETLOGIN_DOWNSTREAM_SECRET=$SECRET \
  node build           # flavors/svelte after `npm run build`
```

## 4. Verify the token in YOUR app
The token is a standard EdDSA JWT. Verify it against the portal's JWKS — **no shared
secret**, works offline once the keys are cached. Any language with a JOSE library does
this; in Node:

```ts
import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(new URL('https://login.acme.com/auth/.well-known/jwks.json'));

export async function getUser(token: string) {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: 'planetlogin',          // or your PLANETLOGIN_JWT_ISSUER
    audience: 'planetlogin',        // or your PLANETLOGIN_JWT_AUDIENCE
  });
  return { id: payload.sub, email: payload.email, name: payload.name };
}
```

SvelteKit consumer (`hooks.server.ts`):
```ts
export const handle = async ({ event, resolve }) => {
  const token = event.cookies.get('planetlogin_session');
  if (token) try { event.locals.user = await getUser(token); } catch { /* invalid → anonymous */ }
  return resolve(event);
};
```

The portal can also validate for you: `GET /auth/session` with `Authorization: Bearer
<token>` → `200 {claims}` or `401`. Prefer local JWKS verification (no round-trip).

## Sessions, refresh, revocation
Tokens are stateless and short-lived (default 1h, `PLANETLOGIN_JWT_TTL`). For hard
logout/revocation or refresh tokens, enable a `session.store` (spec §8) — opt-in, off by
default. `POST /auth/logout` clears the cookie.

## Cross-origin
If your app and the portal are on different origins, set `PLANETLOGIN_COOKIE_DOMAIN`
to a shared parent (e.g. `.acme.com`) so the session cookie is visible to both, or have
your app read the token from the login response and store it itself.

## Deploy
A container recipe for the SvelteKit flavor lives at
[`flavors/svelte/Dockerfile`](flavors/svelte/Dockerfile). Mount the PEM as a secret and
pass the env above. The portal is stateless — scale it horizontally; all instances share
the same JWKS because they share the same private key.

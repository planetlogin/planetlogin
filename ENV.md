# PlanetLogin — Environment contract

Every flavor reads the **same** environment variables. Non-secret presentation
lives in the white-label config ([`config.schema.json`](config.schema.json));
**secrets and wiring live here**. The `demo_admin.html` studio edits the config and
**exports** these — it never stores them.

## Core

| Var | Required | Meaning |
|---|---|---|
| `PLANETLOGIN_BASE_URL` | yes | Public origin of this portal (e.g. `https://login.acme.com`). |
| `PLANETLOGIN_BASE_PATH` | no | Mount path (default `/auth`). |
| `PLANETLOGIN_CONFIG` | yes | The white-label config: a path to a JSON file **or** inline JSON, validated against `config.schema.json`. |

## Tokens (signing)

| Var | Required | Meaning |
|---|---|---|
| `PLANETLOGIN_JWT_ALG` | no | Signing algorithm: `EdDSA` (default), `RS256`, `ES256` (all asymmetric → JWKS) or `HS256` (symmetric → shared secret, **JWKS empty**). Must match `config.token.algorithm`. |
| `PLANETLOGIN_JWT_PRIVATE_KEY` | for asym | Private key (PKCS#8 PEM) that signs session tokens — the **PEM itself** or a **path** to a PEM file (e.g. a Docker secret). Generate one with `npx planetlogin-keygen`. Without it the portal falls back to an ephemeral key (tokens die on restart) and logs a warning. |
| `PLANETLOGIN_JWT_SECRET` | for HS256 | Shared secret (raw string or path to a file) used when `PLANETLOGIN_JWT_ALG=HS256`. Distribute it to verifiers out of band — it is **never** published in JWKS. |
| `PLANETLOGIN_JWT_KID` | no | Key id surfaced in JWKS (enables rotation). |
| `PLANETLOGIN_JWT_ISSUER` | no | `iss` claim (default `PLANETLOGIN_BASE_URL`). |
| `PLANETLOGIN_JWT_AUDIENCE` | no | `aud` claim. |

> For **asymmetric** algorithms the **public** key is derived and published at
> `GET /auth/.well-known/jwks.json`; downstream services verify with it, never with
> the private key. For **HS256** the JWKS is empty and verifiers need the shared
> secret.

## Security (CORS + rate limiting)

PlanetLogin is a stand-alone portal usually called cross-origin and sets cookies,
so CORS must be an **exact allowlist** (no `*` with credentials). Rate limiting
needs a configured `session.store` (it is a no-op with the default `none` store).

| Var | Required | Meaning |
|---|---|---|
| `PLANETLOGIN_CORS_ORIGINS` | no | Comma-separated allowlist of origins (e.g. `https://app.acme.com,https://admin.acme.com`). Merged with `config.security.cors.origins`. `*` is only honored without credentials. |
| `PLANETLOGIN_CORS_CREDENTIALS` | no | `false` to disable credentialed CORS (default sends `Allow-Credentials: true`). |
| `PLANETLOGIN_SESSION_STORE` | no | `none` (default, stateless), `memory`, `redis`, `sqlite`, `downstream`. Required (non-`none`) for rate limiting **and** true single-use magic links. |
| `PLANETLOGIN_RATELIMIT_LOGIN_LIMIT` / `_WINDOW` | no | Override the login fixed-window limit (default 10 / 300s). |
| `PLANETLOGIN_RATELIMIT_MAGIC_LIMIT` / `_WINDOW` | no | Override the magic-link limit (default 5 / 900s). |
| `PLANETLOGIN_RATELIMIT_TOTP_LIMIT` / `_WINDOW` | no | Override the TOTP limit (default 10 / 300s). |
| `PLANETLOGIN_TRUST_PROXY` | no | `true` to read the client IP from `X-Forwarded-For` (set only behind a trusted proxy; otherwise the IP is spoofable). |

> Rate limits **fail open**: if the store is unreachable, requests are allowed — a
> counter outage must not lock everyone out of auth.

## Downstream (your store)

| Var | Required | Meaning |
|---|---|---|
| `PLANETLOGIN_DOWNSTREAM_URL` | yes | Base URL of your identity/persistence REST API (§4 of the spec). |
| `PLANETLOGIN_DOWNSTREAM_SECRET` | yes | Bearer secret PlanetLogin sends on every downstream call. |
| `PLANETLOGIN_DOWNSTREAM_TIMEOUT_MS` | no | Per-call timeout (default `5000`). Fail-closed on timeout. |

## OAuth providers (per provider enabled in config)

For each `providers.oauth[].id`, supply a client id + secret. The config's
`clientIdEnv` names the id var; the secret follows the `*_CLIENT_SECRET` convention:

| Pattern | Example |
|---|---|
| `PLANETLOGIN_OAUTH_<ID>_CLIENT_ID` | `PLANETLOGIN_OAUTH_GOOGLE_CLIENT_ID` |
| `PLANETLOGIN_OAUTH_<ID>_CLIENT_SECRET` | `PLANETLOGIN_OAUTH_GOOGLE_CLIENT_SECRET` |

Redirect URI to register at the provider: `<BASE_URL><BASE_PATH>/oauth/<id>/callback`.

## Sessions / cookies

| Var | Required | Meaning |
|---|---|---|
| `PLANETLOGIN_COOKIE_NAME` | no | Default `planetlogin_session`. |
| `PLANETLOGIN_COOKIE_DOMAIN` | no | For sharing the session across subdomains. |

## SAML (enterprise, optional)

Only when `providers.saml.enabled`. `PLANETLOGIN_SAML_SP_KEY` /
`PLANETLOGIN_SAML_SP_CERT` (the SP keypair) + the IdP metadata URL from config.

---

### Minimal example (`.env`)

```dotenv
PLANETLOGIN_BASE_URL=https://login.acme.com
PLANETLOGIN_CONFIG=./planetlogin.config.json
PLANETLOGIN_JWT_PRIVATE_KEY=/run/secrets/pl_ed25519.pem
PLANETLOGIN_DOWNSTREAM_URL=https://api.acme.com/identity
PLANETLOGIN_DOWNSTREAM_SECRET=change-me
PLANETLOGIN_OAUTH_GOOGLE_CLIENT_ID=...apps.googleusercontent.com
PLANETLOGIN_OAUTH_GOOGLE_CLIENT_SECRET=...
```

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
| `PLANETLOGIN_JWT_PRIVATE_KEY` | yes | EdDSA private key that signs session tokens — the **PEM itself** or a **path** to a PEM file (e.g. a Docker secret). Generate one with `npx planetlogin-keygen`. Keep it secret; without it the portal falls back to an ephemeral key (tokens die on restart) and logs a warning. |
| `PLANETLOGIN_JWT_KID` | no | Key id surfaced in JWKS (enables rotation). |
| `PLANETLOGIN_JWT_ISSUER` | no | `iss` claim (default `PLANETLOGIN_BASE_URL`). |
| `PLANETLOGIN_JWT_AUDIENCE` | no | `aud` claim. |

> The **public** key is derived and published at `GET /auth/.well-known/jwks.json`.
> Downstream services verify tokens with it — never with the private key.

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

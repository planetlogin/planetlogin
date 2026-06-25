# PlanetLogin — Specification v1

Normative contract every **flavor** must satisfy. Keywords **MUST / SHOULD / MAY**
per RFC 2119. The machine-readable parts live alongside: [`openapi.yaml`](openapi.yaml)
(the exposed REST API), [`config.schema.json`](config.schema.json) (white-label
config) and [`ENV.md`](ENV.md) (environment). A flavor conforms when it passes
[`conformance/`](conformance/) against this document.

See [WHITEPAPER.md](WHITEPAPER.md) for the *why*.

---

## 1. Model

PlanetLogin is **stateless**. It holds **no database**. It has two REST surfaces:

```
            ┌──────────────── EXPOSED API (§3) ────────────────┐
  front ───►│  /auth/*  — what PlanetLogin serves              │
            └──────────────────────┬───────────────────────────┘
                                   │ DOWNSTREAM API (§4)
                                   ▼
                      integrator's store (users, sessions, delivery)
```

- A flavor MUST implement the **EXPOSED API** (§3) and call the **DOWNSTREAM API**
  (§4) for every read/write of identity data.
- A flavor MUST NOT persist user data, password hashes, sessions or magic-link
  tokens beyond the in-memory lifetime of a single in-flight flow.
- All cryptography MUST use audited primitives (§6 of the whitepaper); a flavor
  MUST NOT implement its own hashing, signing or random generation.

## 2. Tokens & sessions

- On success PlanetLogin issues a **signed JWT** (the *session token*). The
  algorithm is configurable (`token.algorithm`, §8): an **asymmetric** one
  (`EdDSA` default, `RS256`/`ES256`) so downstream services verify it via the
  published JWKS (`GET /auth/.well-known/jwks.json`), or `HS256` (symmetric, JWKS
  empty, verifiers share the secret out of band).
- Claims: `iss`, `aud`, `sub` (the downstream user id), `iat`, `exp`,
  `email?`, `name?`, `locale?` (`{ language, timezone, country }`).
- TTL from config (`token.ttlSeconds`, default 3600). Refresh: a flavor MAY issue
  an opaque refresh token whose state lives **downstream** (`POST /sessions`).
- PlanetLogin MUST NOT embed secrets or password material in the token.

## 3. Exposed API (`/auth`, base path configurable)

Formal definition in [`openapi.yaml`](openapi.yaml). Summary (all JSON):

| Method · Path | Purpose |
|---|---|
| `GET /auth/config` | Public white-label config for the front (branding, enabled providers, copy). **Never** returns secrets. |
| `GET /auth/.well-known/jwks.json` | Public keys to verify issued JWTs. |
| `POST /auth/password/login` | `{identifier, password}` → verify (argon2id over the hash from §4) → session token. |
| `POST /auth/password/register` | If `providers.password.allowRegister` → upsert downstream → session token. |
| `GET /auth/oauth/{provider}/start` | 302 to the provider (PKCE). |
| `GET /auth/oauth/{provider}/callback` | Exchange code → profile → downstream upsert → session token. |
| `POST /auth/magic/request` | `{identifier}` → issue single-use token → downstream delivers it. Always 202 (no account enumeration). |
| `GET /auth/magic/verify` | `?token=` → verify → session token. |
| `POST /auth/passkey/challenge` | WebAuthn challenge (register or assert). |
| `POST /auth/passkey/verify` | Verify the ceremony → session token. |
| `GET /auth/session` | Validate the current token → claims, or 401. |
| `POST /auth/logout` | Revoke (downstream session delete, if used) + clear cookie. |
| `GET /auth/preferences` | Session-gated → the user's `{locale?, data?}` (locale memory, §6). |
| `PUT /auth/preferences` | Session-gated → save `{locale?, data?}` (partial; fields are independent). |

Rules:
- Errors MUST be a stable shape: `{ "error": { "code": "...", "message": "..." } }`
  with codes from the enum in `openapi.yaml`. Credential failures MUST be
  `invalid_credentials` (never reveal whether the identifier exists).
- The session token is returned **both** as a `Set-Cookie` (HttpOnly, Secure,
  SameSite=Lax) **and** in the JSON body (`{ token }`) for non-browser clients.
- `GET /auth/config` MUST reflect the active white-label config (§5).

## 4. Downstream API (the integrator implements; PlanetLogin calls)

Base URL from `PLANETLOGIN_DOWNSTREAM_URL`; requests authenticated with
`PLANETLOGIN_DOWNSTREAM_SECRET` (Bearer). PlanetLogin calls — the integrator owns
the storage. A flavor MUST call these and MUST tolerate 404s.

| Method · Path | PlanetLogin sends | Expects |
|---|---|---|
| `POST /users/find` | `{identifier}` | `{id, email, name?, passwordHash?, locale?}` or 404 |
| `POST /users/upsert` | `{provider, providerUserId?, email?, name?, profile}` | `{id, email, name?}` |
| `POST /sessions` | `{userId, kind:"refresh", expiresAt}` | `{id}` (only if refresh/revocation used) |
| `DELETE /sessions/{id}` | — | 204 |
| `POST /magic/deliver` | `{identifier, link, locale}` | 202 (integrator sends the email/SMS) |
| `POST /passkeys/find` | `{userId? , credentialId?}` | `{credentials:[...]}` |
| `POST /passkeys/save` | `{userId, credential}` | 201 |
| `POST /preferences/find` | `{userId}` | `{locale?, data?}` or 404 |
| `POST /preferences/save` | `{userId, locale?, data?}` | 201 (partial: omitted fields unchanged) |

- PlanetLogin verifies passwords by fetching `passwordHash` via `/users/find` and
  comparing with **argon2id** locally. The integrator MUST store an argon2id hash
  (or omit it and use another method). PlanetLogin MUST NOT receive plaintext from
  storage.
- All downstream calls MUST be over TLS and time-limited; a flavor MUST fail
  closed (deny login) if downstream is unreachable.

## 5. White-label config

One schema, [`config.schema.json`](config.schema.json), drives branding, providers,
copy/i18n and layout. Loaded identically from **env** (self-host, §ENV) or the
**admin studio** (`demo_admin.html`). `GET /auth/config` exposes the **public
subset** (no secrets, no client secrets, no downstream URL).

## 6. i18n & locale

- The front detects locale from the globe pick and from the browser; it MUST set
  `<html lang>` and localize copy.
- `locale` (`{language, timezone, country}`, optionally `{lat, lon}`) MUST be
  attached to the session token claims so downstream apps can honor it.
- Copy MUST be overridable per language via `config.copy`.

### Locale memory (progressive enhancement; all gates default OFF)

PlanetLogin can remember a user's place and replay the globe fly-to. It degrades
by what's available — a pure-frontend embed gets full memory with **no backend**:

- **Tier 0 — device (frontend only, no backend).** The globe component persists the
  picked locale to browser storage (`remember`) and flies to it on return
  (`flyToSaved`). Pure client; works on a static page. Per device.
- **Tier 1 — session.** The `locale` claim already rides the JWT — a returning
  login carries language/timezone/country for free (used for i18n).
- **Tier 2 — account (needs a flavor + downstream).** `config.locale.persist`
  writes the picked locale (incl. coordinates) to the user via `/preferences/*`;
  `config.locale.flyToOnLogin` makes the login page fly the globe to the account's
  saved place before handoff. The open `data` bag is the integrator's to use.
  Fly-to-on-login needs coordinates, which is why it requires Tier 2 persistence.

## 7. Conformance

A flavor is **conformant** when, against this spec:
1. `openapi.yaml` request/response shapes validate for every endpoint in §3.
2. The §4 downstream calls are made with the documented payloads (verified against
   a mock downstream in `conformance/`).
3. The behavior rules (error codes, no-enumeration, fail-closed, token shape,
   stateless) hold.
4. The white-label config from §5 round-trips (env → `GET /auth/config`).

`conformance/` ships a mock downstream + a black-box test suite; CI runs it per
flavor and publishes the matrix. `bench/` runs the same scenario for the perf
leaderboard.

## 8. Crypto profiles & optional state (all-terrain)

PlanetLogin adapts to the consumer's and the store's existing crypto — within a
safe envelope (no `alg:none`, no MD5/SHA1 for passwords).

- **Token signing is configurable** (`token.algorithm`): `EdDSA`/`RS256`/`ES256`
  (asymmetric → multi-service verification via JWKS) or `HS256` (symmetric "simple
  mode", single trust domain, no JWKS). Optional JWE for encrypted claims. The JWT
  is the *default issued session*; a consumer MAY ignore it and mint its own from
  the verified identity.
- **Password verification auto-detects the stored hash format** (argon2id, bcrypt,
  scrypt, pbkdf2 — by the PHC prefix), so PlanetLogin drops in front of an existing
  user store without rehashing. New hashes default to argon2id.
- **State is optional** (`session.store`, default `none`):
  - `none` → fully stateless; single-use / revocation degrade to short TTLs.
  - `memory` / `sqlite` → local store; enables true single-use & revocation but
    makes the instance **stateful** (no horizontal scale).
  - `redis` / `downstream` → shared state; preserves multi-instance.
  - Refresh tokens & revocation are **opt-in** capabilities of a store, never
    required of the downstream contract.

## 9. Hardening (CORS & rate limiting)

A conformant flavor SHOULD:

- **CORS** — the auth API is called cross-origin and sets cookies, so it MUST use
  an **exact origin allowlist** (`security.cors.origins` / `PLANETLOGIN_CORS_ORIGINS`)
  and MUST NOT send `Access-Control-Allow-Origin: *` together with
  `Allow-Credentials: true`. It reflects the concrete allowlisted origin and always
  sets `Vary: Origin`; preflight `OPTIONS` returns `204`.
- **Rate limiting** — brute-force-prone endpoints (`/auth/password/login`,
  `/auth/magic/request`, `/auth/totp/verify`) are throttled with a fixed window
  (`security.rateLimit.*`). Over-limit requests return **`429`** with `Retry-After`.
  Login is keyed by IP + identifier; magic by IP only (so an attacker can't lock a
  victim's mailbox). Throttling needs `session.store != none` and **fails open** if
  the store is unreachable. The `none` store leaves it disabled (stateless default).

## 10. Versioning

This spec is versioned (`spec: 1`). A flavor declares the spec version it targets
in its `GET /auth/config` (`{ "spec": 1 }`). Breaking changes bump the major.

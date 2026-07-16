# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — deploy-your-own

### Added
- **Prebuilt portal image** `ghcr.io/planetlogin/portal` — a CI workflow builds &
  publishes the SvelteKit flavor (linux/amd64 + arm64) on every `main` push;
  `portal-v*` tags cut versioned images. Deploy-your-own is now `docker run`, no
  clone/build.
- **[DEPLOY.md](DEPLOY.md)** — zero-to-live guide (config + key + compose + checklist).
- **Studio "docker-compose.yml" tab** — the white-label studio exports a ready-to-run
  compose (image + env + volumes + the 4 steps) alongside `config.json` / `.env`.

## [Unreleased] — self-serve sign-up

### Added (`@planetlogin/core` 0.9.0)
- **`createUser` joins the §4 contract** — `DownstreamStore.createUser({ email, password, name?, locale? })`; the HTTP `Downstream` maps it to `POST /users/create` and `defineStore` wires it (fail-closed if unimplemented). The downstream owns password storage: **it** hashes and stores; PlanetLogin never persists a password.
- **`DownstreamConflictError`** — a taken email surfaces as a typed conflict (downstream 409), so self-serve sign-up can answer "that email is already registered" without leaking anything else. The HTTP client maps any 409 to it.
- The Svelte flavor's `/auth/password/register` now goes **through the contract client**, so **in-process stores (`defineStore`) support sign-up too** — it previously hand-rolled an HTTP fetch, which locked sign-up to the REST downstream.
- `@planetlogin/store-sqlite` / `@planetlogin/store-postgres` **0.2.0**: `createUser` raises `DownstreamConflictError` on a duplicate email (now require core ≥ 0.9.0).
- Conformance **26 checks** (+3): register → the downstream creates + hashes → session, and the fresh account logs in; duplicate → 409; too-short password → 400. The reference `examples/downstream` implements `/users/create` hashing with node's built-in **scrypt** (still zero deps) — which also proves the all-terrain verifier accepts a non-argon2 store.

## [0.6.0] — in-process downstream

### Added (`@planetlogin/core`)
- **In-process downstream** — the §4 contract is now an exported interface `DownstreamStore`, and `defineStore({ findUser, … })` builds one from local functions. A SvelteKit/monolith app can talk to its DB directly (no REST routes, no HTTP hop); implement only the methods your enabled providers use (unimplemented ones throw a clear fail-closed error). The HTTP `Downstream` now `implements DownstreamStore`, and every flow takes a `DownstreamStore` — so in-process and HTTP are interchangeable.
- Docs: SPEC §4, INTEGRATION.md (the in-process pattern for SvelteKit). +3 tests (core 72). No breaking changes (the HTTP path is unchanged).

## [Unreleased] — anonymous / guest sessions

### Added (`@planetlogin/core` + flavors)
- **Anonymous (guest) sessions — the zero-backend path.** `providers.anonymous.enabled` + `POST /auth/anonymous` `{locale?}` mints a signed session for a fresh random `sub`, carrying the picked locale, with **no account and no downstream**. The globe → a signed locale token, verifiable via the same JWKS. `createAnonymousSession()` in core; `SessionClaims.anon`; `anon` rate-limit rule (30/5min). Rate-limited by IP in both flavors.
- ⚠️ The token carries `anon: true` — it's a session identity, **not** authentication of a person. Consumers must treat it as unauthenticated for anything sensitive. Upgrade path: bind the `sub` to a real account later (uses the downstream). SPEC §3; config.schema; +4 tests (core 69).

## [Unreleased] — encrypted session tokens (JWE)

### Added (`@planetlogin/core`)
- **Optional JWE encryption of the session token.** `config.token.encrypt` / `PLANETLOGIN_JWT_ENCRYPT=true` wraps the signed JWS in a JWE (`dir`+A256GCM, key `PLANETLOGIN_JWE_KEY`) — a **nested JWT** so claims (email, locale…) are confidential to the client. The inner signature is preserved, so a holder of the JWE key decrypts then verifies via JWKS; works with any signing algorithm. `verifySession` transparently decrypts. Off by default.
- `planetlogin-keygen --jwe` emits a 32-byte base64url JWE key. `config.token.encrypt` in the schema; `PLANETLOGIN_JWT_ENCRYPT`/`PLANETLOGIN_JWE_KEY` in ENV.md; SPEC §8. 5 new tests (core 65).

## [Unreleased] — locale memory Tier 2 (account-bound)

### Added (`@planetlogin/core` + flavors + reference downstream)
- **Account-bound locale memory.** `config.locale.persist` writes the picked locale (incl. coordinates) to the user's downstream record on login; `config.locale.flyToOnLogin` makes the login page fly the globe to the account's saved place after auth. Both default **off**.
- **`GET`/`PUT /auth/preferences`** (session-gated) — the user's `{locale?, data?}`. `data` is an open, integrator-owned bag for "that kind of info". Save is partial (locale and data are independent).
- Downstream contract (§4): `POST /preferences/find` + `POST /preferences/save` (`Downstream.preferencesGet`/`preferencesSave`); `Locale` gains optional `lat`/`lon`; `UserPreferences` type. Core flow `getPreferences`/`savePreferences` with `sanitizeLocale` (clients can't write junk into the typed locale). Reference downstream (`examples/downstream`) implements both routes (SQLite).
- Wired in both flavors (Svelte routes + `hooks`-free page fly-to; vanilla `/auth/preferences` + persist-on-login). SPEC §3/§4/§6, `openapi.yaml`, `config.schema.json` updated. Core tests **60** (6 new); Tier 2 smoke 7/7 vs the reference downstream.
- Note: device-only memory (no backend) remains Tier 0 in the globe component (`@planetlogin/planetlogin` ≥0.2.0).

## [@planetlogin/planetlogin 0.2.0] — 2026-06-25 — locale memory (Tier 0)

### Added (globe Web Component)
- **Locale memory, device-local, zero backend.** Opt-in: the globe can remember the picked locale in browser storage and fly back to it on return — no server, no login. Options `remember`, `flyToSaved`, `storageKey`, `storage` (`local`|`session`|`none`); element attributes `remember` / `fly-to-saved` / `storage-key` / `storage`. Both gates default **off** (privacy-first).
- **Imperative API:** `flyTo(lon, lat)`, `getSavedLocale()`, `clearSavedLocale()` on both the class and the `<planet-login>` element.
- **Pure helpers** `readSavedLocale` / `writeSavedLocale` / `clearSavedLocale` / `DEFAULT_STORAGE_KEY` exported — devs can read/write the remembered locale without an instance (the frontend-only "API"). All best-effort, never throw (private mode / quota / SSR → no-op).
- Svelte flavor demo uses `remember fly-to-saved`. 5 new tests (`src/memory.test.ts`). Globe tests **11**.
- Note: per-account memory (survives devices) + fly-to-on-login from the account need coordinates persisted server-side — that is a **Tier 2** feature (downstream contract), intentionally deferred.

## [@planetlogin/core 0.2.0] — 2026-06-25 — auth core hardening

Published to npm. Flavors now depend on `^0.2.0`. Also: rate limiting wired into
`/auth/totp/verify` (IP+identifier) in both flavors; CI split into per-workspace
jobs (globe / core / conformance) so the core's 54 tests and the black-box
conformance suite run on every push (previously only the globe was tested).

### Added (`@planetlogin/core` + flavors)
- **All-terrain `token.algorithm`:** session/magic JWTs can now be signed with `EdDSA` (default), `RS256`, `ES256` (asymmetric → JWKS) or `HS256` (symmetric → shared `PLANETLOGIN_JWT_SECRET`, JWKS stays empty). Selected via `PLANETLOGIN_JWT_ALG`.
- **Rate limiting:** fixed-window brute-force protection (`rateLimit`, `ruleFor`, `rlKey`) backed by the pluggable store. Wired into `/auth/password/login` (IP+identifier) and `/auth/magic/request` (IP only) in both flavors — `429` + `Retry-After`. No-op until `session.store` is configured; **fails open** on store outage. Added `SessionStore.incr`.
- **CORS:** exact-allowlist credentialed CORS (`corsHeaders`, `corsFromEnv`, `originAllowed`, `isPreflight`) from `PLANETLOGIN_CORS_ORIGINS` + `config.security.cors`. Svelte via `hooks.server.ts`, vanilla inline; never `*` with credentials, always `Vary: Origin`, `OPTIONS` → `204`.
- `config.security` block in `config.schema.json`; new `PLANETLOGIN_*` vars in `ENV.md`; SPEC §2/§8/§9 updated.
- 21 new core tests (rate limit, CORS, JWT algorithms); flavor smoke verified (CORS preflight, 429, JWKS). Core **54 tests**, svelte conformance **8/8**.

## [0.1.2] — 2026-06-24

### Added
- **Keyboard control of the globe:** the canvas is focusable — arrow keys rotate, `+`/`-` zoom, `Enter`/`Space` selects the country at the centre (with a focus ring and live highlight). A fully keyboard-operable alternative to dragging.
- **Much larger language map:** `country → language` now covers ~150 countries (was ~25), so language detection is right far more often.

## [0.1.1] — 2026-06-24

### Added
- **Accessibility:** respects `prefers-reduced-motion` (no idle auto-rotation, near-instant fly-to); `role`/`aria-label` on the globe canvas; `aria-label` + `type=search` on the search input and an `aria-label` on the Locate button.

### Changed
- Published as the scoped package **`@planetlogin/planetlogin`** under the `planetlogin` org (mirrors the GitHub repo). The previous `@rricajos/planetpass` is deprecated.

## [Unreleased]

### Changed
- **Rebrand: `planetpass` → `planetlogin`.** New package name `planetlogin`
  (unscoped), Web Component `<planet-login>`, class/factory `PlanetLogin` /
  `createPlanetLogin`, events `planetlogin:*`, watermark `PlanetLogin · by Ricajos`.
- Project moves to a dedicated community home (`planetlogin.org`).

### Added
- Contributor docs: `CONTRIBUTING`, `CODE_OF_CONDUCT`, `SECURITY`.
- Issue / PR templates and CI (build + typecheck + tests) on every push and PR.
- Unit tests for locale and geocode helpers.
- Framework usage examples (vanilla, React, Vue, Svelte).

## [0.1.0] — 2026-06-23

Initial public release (as `@rricajos/planetpass`).

### Added
- Orthographic globe locale picker (d3-geo) with drag, inertia, wheel-zoom and
  click-to-pick.
- Keyless geocoding (Open-Meteo + OSM Nominatim) → IANA timezone, country, language.
- Distribution as a Web Component, a class, and a factory; ESM + UMD + `.d.ts`.
- AGPL-3.0 with an attribution term (§7b).

[Unreleased]: https://github.com/planetlogin/planetlogin/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/planetlogin/planetlogin/releases/tag/v0.1.0

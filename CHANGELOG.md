# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

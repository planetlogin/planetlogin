# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres
to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

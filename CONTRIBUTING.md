# Contributing to PlanetLogin

Thanks for helping — PlanetLogin is a community project and contributions of every
size are welcome, from typo fixes to new framework wrappers.

## Ground rules

- Be kind. See the [Code of Conduct](CODE_OF_CONDUCT.md).
- Keep it dependency-light. The whole point is a tiny, no-key, no-tracking component
  — new runtime dependencies need a strong reason.
- Don't remove the attribution watermark; it's a license term (AGPLv3 §7b), not a bug.

## Getting set up

```bash
git clone https://github.com/planetlogin/planetlogin
cd planetlogin
npm i
npm run dev        # demo at localhost:5173
```

Useful scripts:

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with the demo page. |
| `npm run build` | Build `dist/` (ESM + UMD + `.d.ts`). |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Run the unit tests (Vitest). |

## Before you open a PR

1. `npm run typecheck` is clean.
2. `npm test` passes (add a test if you fix a bug or add logic).
3. `npm run build` succeeds.
4. The demo still works (`npm run dev`) and the globe renders.

Keep PRs focused — one concern per PR. Describe the *why*, not just the *what*.

## Project layout

```
src/
  index.ts        public API (createPlanetLogin, exports, custom element registration)
  planetlogin.ts  the globe: canvas render loop, interaction, fly-to, pick
  element.ts      <planet-login> Web Component wrapper
  types.ts        PlanetLocale + PlanetLoginOptions
  locale.ts       country (ISO alpha-2) → language map
  geocode.ts      Open-Meteo + Nominatim forward/reverse geocoding (no key)
index.html        dev demo
```

The **`simple`** branch holds the single-file, zero-build version — if you change
public behavior, please keep it roughly in sync (or note it in your PR).

## Good first issues

- More entries in the `country → language` map (`src/locale.ts`).
- Framework wrapper examples under `examples/`.
- Accessibility: keyboard control of the globe, ARIA on the search box.
- Reduced-motion handling for the auto-spin.

## Reporting bugs / ideas

Open an [issue](https://github.com/planetlogin/planetlogin/issues) with a clear repro
(a CodeSandbox/StackBlitz is gold). For security reports, see [SECURITY.md](SECURITY.md).

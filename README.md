<div align="center">

# PlanetPass

**Sign in with a planet.** A framework-agnostic globe component that detects your
**timezone**, **language** and **location** — so your app greets a visitor in their
tongue, in their hours, from the first second.

**[Live demo →](https://rricajos.github.io/planetpass/)** · `@rricajos/planetpass`

</div>

---

Spin the globe, drag it (with inertia), **zoom with the wheel**, **click a country**
or search a postal code / city / country. PlanetPass flies to it and emits a
`locale`. Works in **React, Vue, Svelte, Angular or plain HTML** — it's a Web Component.

## Install

```bash
npm i @rricajos/planetpass
```

…or drop it in with a `<script>` (no build):

```html
<planet-pass style="display:block;width:100%;height:480px"></planet-pass>
<script type="module" src="https://cdn.jsdelivr.net/npm/@rricajos/planetpass"></script>
```

## Use it

**As a Web Component** (any framework / plain HTML):

```html
<planet-pass accent="#f6a13c" resolution="110m"></planet-pass>
<script type="module">
  import '@rricajos/planetpass';
  document.querySelector('planet-pass').addEventListener('locale', (e) => {
    const { language, timezone, country, lat, lon, label } = e.detail;
    setAppLanguage(language);
    setAppTimezone(timezone);
  });
</script>
```

**As a function** (full control, TypeScript types included):

```ts
import { createPlanetPass, type PlanetLocale } from '@rricajos/planetpass';

const globe = createPlanetPass(document.getElementById('globe')!, {
  accent: '#f6a13c',
  onLocale: (loc: PlanetLocale) => console.log(loc),
});
globe.flyTo(2.17, 41.39);   // fly to Barcelona
// globe.destroy() when done
```

## Options

| Option | Type | Default | |
|---|---|---|---|
| `accent` | `string` | `#f6a13c` | Brand color (highlight, button). |
| `search` | `boolean` | `true` | Show the built-in search box. |
| `placeholder` | `string` | — | Search box placeholder. |
| `autoSpin` | `boolean` | `true` | Gentle rotation until the first pick. |
| `resolution` | `'110m' \| '50m'` | `'110m'` | Border detail. |
| `dataUrl` | `string` | — | Override the world-atlas TopoJSON URL. |
| `onLocale` | `(l: PlanetLocale) => void` | — | Callback on every pick. |

## The `locale` payload

```ts
interface PlanetLocale {
  lat: number; lon: number;
  country: string;       // ISO alpha-2
  timezone: string;      // IANA, or approximate "UTC±N"
  language: string;      // e.g. "es"
  label: string;         // "Barcelona, Spain"
  approxTimezone?: boolean;
}
```

## How it works

Real orthographic globe via [d3-geo](https://github.com/d3/d3-geo) (correct hemisphere
clipping). Geocoding with **no API key** — [Open-Meteo](https://open-meteo.com) (precise
IANA timezone) with an [OSM Nominatim](https://nominatim.org) fallback. Country borders
from [world-atlas](https://github.com/topojson/world-atlas), fetched at runtime.

## Develop

```bash
npm i
npm run dev        # demo at localhost:5173
npm run build      # dist/ (ESM + UMD + .d.ts)
npm run typecheck
```

Branches: `main` = the component · [`simple`](https://github.com/rricajos/planetpass/tree/simple) = a zero-build, single-file version to copy-paste.

## License & attribution

**[AGPL-3.0](LICENSE)** with an **attribution term** (AGPLv3 §7b).

- **Free for any use, including commercial.**
- Modify / host a modified version → **share your source** under the same license (copyleft).
- **Keep the visible `PlanetPass · by Ricajos` credit** (→ [ricajos.com](https://ricajos.com)). Removing it needs written permission — a commercial / white-label license is available, open an issue.

## Credits

Created by **Ricard** ([Ricajos](https://ricajos.com)) · [@rricajos](https://github.com/rricajos).
Born as the onboarding for [calcat](https://calcat.app), released standalone.

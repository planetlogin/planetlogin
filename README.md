<div align="center">

# PlanetLogin

**Sign in with a planet.** A framework-agnostic globe component that detects a
visitor's **timezone**, **language** and **location** — so your app greets them in
their tongue, in their hours, from the first second.

[![npm](https://img.shields.io/npm/v/@planetlogin/planetlogin?color=f6a13c)](https://www.npmjs.com/package/@planetlogin/planetlogin)
[![license](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)
[![CI](https://github.com/planetlogin/planetlogin/actions/workflows/ci.yml/badge.svg)](https://github.com/planetlogin/planetlogin/actions/workflows/ci.yml)
[![bundle](https://img.shields.io/bundlephobia/minzip/@planetlogin/planetlogin?label=gzip)](https://bundlephobia.com/package/@planetlogin/planetlogin)

**[Live demo → planetlogin.org](https://planetlogin.org)** · `npm i @planetlogin/planetlogin`

</div>

---

Spin the globe, drag it (with inertia), **zoom with the wheel**, **click a country**,
or search a postal code / city / country. PlanetLogin flies there and emits a
`locale`. Works in **React, Vue, Svelte, Angular or plain HTML** — it ships as a
standard Web Component, a class, and a factory.

- 🌍 **Real orthographic globe** (d3-geo) — correct hemisphere clipping, drag, inertia, zoom.
- 🗣️ **Detects timezone + language + country** from a single pick.
- 🔑 **No API key, no tracking** — geocoding via Open-Meteo + OSM Nominatim.
- 📦 **~17 kB gzip**, zero peer deps, TypeScript types included.
- 🧩 **Web Component** → drops into any framework or plain HTML.

## Install

```bash
npm i @planetlogin/planetlogin
```

…or drop it in with a `<script>` (no build step):

```html
<planet-login style="display:block;width:100%;height:480px"></planet-login>
<script type="module" src="https://cdn.jsdelivr.net/npm/@planetlogin/planetlogin"></script>
```

## Quickstart

### Plain HTML / any framework (Web Component)

```html
<planet-login accent="#f6a13c" resolution="110m"></planet-login>
<script type="module">
  import '@planetlogin/planetlogin';
  document.querySelector('planet-login').addEventListener('locale', (e) => {
    const { language, timezone, country, lat, lon, label } = e.detail;
    setAppLanguage(language);
    setAppTimezone(timezone);
  });
</script>
```

### Function API (full control, typed)

```ts
import { createPlanetLogin, type PlanetLocale } from '@planetlogin/planetlogin';

const globe = createPlanetLogin(document.getElementById('globe')!, {
  accent: '#f6a13c',
  onLocale: (loc: PlanetLocale) => console.log(loc),
});

globe.flyTo(2.17, 41.39);   // fly to Barcelona and pick it
globe.search('Tokyo');      // or search by name / postal code
// globe.destroy();         // tear down when done
```

### React

```tsx
import { useEffect, useRef } from 'react';
import { createPlanetLogin, type PlanetLocale } from '@planetlogin/planetlogin';

export function GlobeLogin({ onLocale }: { onLocale: (l: PlanetLocale) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const globe = createPlanetLogin(ref.current!, { onLocale });
    return () => globe.destroy();
  }, [onLocale]);
  return <div ref={ref} style={{ width: '100%', height: 480 }} />;
}
```

### Vue 3

```vue
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { createPlanetLogin, type PlanetLogin } from '@planetlogin/planetlogin';

const el = ref<HTMLElement>();
let globe: PlanetLogin;
onMounted(() => { globe = createPlanetLogin(el.value!, { onLocale: (l) => emit('locale', l) }); });
onBeforeUnmount(() => globe?.destroy());
const emit = defineEmits<{ locale: [unknown] }>();
</script>

<template><div ref="el" style="width:100%;height:480px" /></template>
```

### Svelte

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { createPlanetLogin, type PlanetLogin, type PlanetLocale } from '@planetlogin/planetlogin';
  let el: HTMLElement;
  let globe: PlanetLogin;
  export let onlocale: (l: PlanetLocale) => void = () => {};
  $: if (el && !globe) globe = createPlanetLogin(el, { onLocale: onlocale });
  onDestroy(() => globe?.destroy());
</script>

<div bind:this={el} style="width:100%;height:480px"></div>
```

## Options

| Option | Type | Default | |
|---|---|---|---|
| `accent` | `string` | `#f6a13c` | Brand color (highlight, button). |
| `search` | `boolean` | `true` | Show the built-in search box. |
| `placeholder` | `string` | `Postal code, city or country…` | Search box placeholder. |
| `autoSpin` | `boolean` | `true` | Gentle rotation until the first pick. |
| `resolution` | `'110m' \| '50m'` | `'110m'` | Border detail (50m = sharper, heavier). |
| `dataUrl` | `string` | world-atlas CDN | Override the country TopoJSON URL. |
| `onLocale` | `(l: PlanetLocale) => void` | — | Callback on every pick. |
| `remember` | `boolean` | `false` | Persist the picked locale to browser storage (see [Locale memory](#locale-memory)). |
| `flyToSaved` | `boolean` | `false` | On mount, fly to the remembered locale and re-emit it. |
| `storageKey` | `string` | `planetlogin:locale` | Storage key for the remembered locale. |
| `storage` | `'local' \| 'session' \| 'none'` | `'local'` | Where to persist (or disable). |

The Web Component mirrors these as attributes: `accent`, `resolution`, `search`,
`placeholder`, `autospin`, `remember`, `fly-to-saved`, `storage-key`, `storage`.

## Methods

| Method | |
|---|---|
| `on('locale', cb)` | Add a listener fired on every pick. Returns `this`. |
| `flyTo(lon, lat)` | Animate to coordinates and pick them. |
| `search(query)` | Geocode a string and fly to the result (async). |
| `getSavedLocale()` | The locale remembered on this device, or `null`. |
| `clearSavedLocale()` | Forget the remembered locale on this device. |
| `destroy()` | Stop animation and remove all DOM it created. |

## The `locale` payload

Delivered three ways — the `locale` DOM `CustomEvent` (bubbles), the `on('locale', …)`
listener, and the `onLocale` option:

```ts
interface PlanetLocale {
  lat: number; lon: number;
  country: string;        // ISO 3166-1 alpha-2, uppercase
  timezone: string;       // IANA ("Europe/Madrid") or approximate "UTC±N"
  language: string;       // BCP-47-ish, e.g. "es"
  label: string;          // "Barcelona, Spain"
  approxTimezone?: boolean; // true when tz is a longitude estimate, not IANA
}
```

## Locale memory

Opt-in, **device-local, zero backend**: the globe can remember where the user
picked and fly back to it next time. Both gates are off by default (privacy-first).

```html
<planet-login remember fly-to-saved></planet-login>
```

```ts
// Or with the function API:
const planet = createPlanetLogin(el, { remember: true, flyToSaved: true });
planet.getSavedLocale();   // → PlanetLocale | null
planet.clearSavedLocale(); // forget it
```

Read or write the saved value **without an instance** (e.g. to pre-fill a form on
a static page) — these are pure helpers over `localStorage`, never throw:

```ts
import { readSavedLocale, writeSavedLocale, clearSavedLocale } from '@planetlogin/planetlogin';
const saved = readSavedLocale(localStorage); // PlanetLocale | null
```

> **Per-account memory** (survives devices, flies to the user's place on login)
> needs a backend: run a PlanetLogin auth flavor with a downstream store and turn
> on `config.locale.persist` / `flyToOnLogin`. See the [SPEC](SPEC.md#6-i18n--locale).

## How it works

A real orthographic globe via [d3-geo](https://github.com/d3/d3-geo) (proper hemisphere
clipping, not a flat map). Geocoding with **no API key** — [Open-Meteo](https://open-meteo.com)
gives a precise IANA timezone, with an [OSM Nominatim](https://nominatim.org) fallback for
postal codes and reverse lookups. Country borders come from
[world-atlas](https://github.com/topojson/world-atlas), fetched at runtime from a CDN.

## Develop

```bash
npm i
npm run dev        # demo at localhost:5173
npm run build      # dist/ (ESM + UMD + .d.ts)
npm run typecheck
npm test           # unit tests
```

Branches: **`main`** = the component · **[`simple`](https://github.com/planetlogin/planetlogin/tree/simple)** = a zero-build, single-file version to copy-paste.

See [CONTRIBUTING.md](CONTRIBUTING.md) — issues and PRs welcome.

## License & attribution

**[AGPL-3.0](LICENSE)** with an **attribution term** (AGPLv3 §7b).

- **Free for any use, including commercial.**
- Modify / host a modified version → **share your source** under the same license (copyleft).
- **Keep the visible `PlanetLogin · by Ricajos` credit** (→ [ricajos.com](https://ricajos.com)).
  Removing it needs written permission — a commercial / white-label license is available,
  [open an issue](https://github.com/planetlogin/planetlogin/issues).

## Credits

Created by **Ricard** ([Ricajos](https://ricajos.com)) · [@rricajos](https://github.com/rricajos).
Born as the onboarding for [calcat](https://calcat.app), released standalone as a
community project.

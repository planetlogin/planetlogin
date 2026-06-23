<div align="center">

# Planetpass

**Sign in with a planet.** A login screen with an interactive globe that detects
your **timezone**, sets the **language**, and collects location metadata — so an
app greets you in your tongue, in your hours, from the first second.

**[Live demo →](https://rricajos.github.io/planetpass/)**

</div>

---

Spin the globe, drag it (with inertia), **zoom with the wheel**, **click a country**
or type a postal code / city / country. Planetpass flies to it, and the whole UI —
including the sign-in panel — **re-localizes live** into that place's language.

One self-contained `index.html`. No build step, no framework, no API key.

## Features

- **Real orthographic globe** (continents, borders, graticule) via [d3-geo](https://github.com/d3/d3-geo) — correct hemisphere clipping, no projection hacks.
- **Drag to rotate** with inertia; **wheel to zoom**; drag sensitivity scales with zoom.
- **Click a country** → flies, de-zooms, re-centers and zooms in; stays put, highlighted. Interruptible (scroll/drag cancels mid-flight).
- **Search** postal code / city / country (Open-Meteo + Nominatim — free, no key).
- Detects **language + timezone + coordinates**; demo re-localizes ~10 languages live.
- **Login panel** (sign in / sign up, social) included — it's a drop-in auth screen, not just a picker.
- Self-hosted [Inter](https://rsms.me/inter/) font, [MDI](https://pictogrammers.com/library/mdi/) icons. No emojis.

## Use it

Drop `index.html` and `fonts/` on any static host. On a successful pick it:

- writes `localStorage.planetpass_locale` and a `planetpass_locale` cookie,
- emits a `planetpass:locale` **CustomEvent** and a `postMessage` (for iframe embeds):

```js
window.addEventListener('planetpass:locale', (e) => {
  // { lat, lon, country, timezone, language, label }
  applyLanguage(e.detail.language);
  applyTimezone(e.detail.timezone);
});
```

Embedding it in an iframe? Listen for the message on the parent:

```js
window.addEventListener('message', (e) => {
  if (e.data?.type === 'planetpass:locale') console.log(e.data.payload);
});
```

## Customize

- **Colors:** CSS variables at the top of `index.html` (`--accent`, `--surface`, …).
- **Languages:** the `I18N` object — add a locale, it's picked up automatically.
- **Globe data:** swap `countries-110m` for `countries-50m` for finer borders.

## Stack

Vanilla JS · [d3-geo](https://github.com/d3/d3-geo) · [topojson-client](https://github.com/topojson/topojson-client) · [world-atlas](https://github.com/topojson/world-atlas) (from jsDelivr) · [Inter](https://rsms.me/inter/) (self-hosted).

## License & attribution

**[AGPL-3.0](LICENSE)** with an **attribution term** (AGPLv3 §7b).

- **Free for any use, including commercial.**
- If you modify, redistribute, or host a modified version, you must **share your
  source** under the same license (copyleft).
- You must **keep the visible `Planetpass · by Ricajos` credit** (linking to
  [ricajos.com](https://ricajos.com)). Removing it requires written permission.

Want it without copyleft or without the credit? Open an issue — a commercial /
white-label license is available.

## Credits

Created by **Ricard** ([Ricajos](https://ricajos.com)) · [@rricajos](https://github.com/rricajos).
Born as the onboarding for [calcat](https://calcat.app), released standalone.

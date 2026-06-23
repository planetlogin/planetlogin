# Examples

Minimal, copy-pasteable integrations. All of them install the same package:

```bash
npm i planetlogin
```

| File | Stack | Notes |
|---|---|---|
| [`vanilla.html`](vanilla.html) | Plain HTML | No build step — loads from the jsDelivr CDN. Open it in a browser. |
| [`react.tsx`](react.tsx) | React 18/19 | `useEffect` mount + cleanup wrapper. |
| [`Vue.vue`](Vue.vue) | Vue 3 | `<script setup>` with `defineEmits`. |
| [`Svelte.svelte`](Svelte.svelte) | Svelte 5 | `bind:this` + `onDestroy`. |

Every integration listens for a single thing — the `PlanetLocale` payload:

```ts
{ lat, lon, country, timezone, language, label, approxTimezone? }
```

Wire `language` into your i18n library and `timezone` into your date handling, and
your app is localized from the user's first interaction. See the
[main README](../README.md) for the full API.

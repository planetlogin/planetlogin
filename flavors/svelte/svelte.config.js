import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Mount point (build-time). Empty = stand-alone subdomain (auth.example.com).
// Set PLANETLOGIN_BASE (e.g. /auth) to consume PlanetLogin same-origin under a
// path of another app — assets and the front then live under that prefix.
const base = process.env.PLANETLOGIN_BASE || '';

// When path-mounted behind a proxy, emit ABSOLUTE base-prefixed asset URLs
// (/auth/_app/…) so they don't depend on the page's trailing slash.
export default {
  preprocess: vitePreprocess(),
  kit: { adapter: adapter(), paths: { base, relative: !base } },
};

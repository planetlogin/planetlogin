import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// @planetlogin/core ships built ESM + types (no source transpilation needed),
// so it's externalized for SSR like any other dependency.
export default defineConfig({ plugins: [sveltekit()] });

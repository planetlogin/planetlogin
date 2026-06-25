import { defineConfig } from 'vite';

// Library build, framework-agnostic. d3-geo + topojson-client are bundled so the
// output is self-contained (a plain <script> drop-in works). world-atlas country
// data is fetched at runtime from a CDN (configurable via options.dataUrl).
// Type declarations are emitted separately by `tsc -p tsconfig.dts.json`.
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'PlanetLogin',
      fileName: 'planetlogin',
      formats: ['es', 'umd'],
    },
  },
  // Root package = the globe component. Its tests live in src/. The auth core
  // (packages/core) and the conformance suite have their own runners — don't let
  // the root `vitest run` glob into them (conformance needs a live server → CI red).
  test: {
    include: ['src/**/*.{test,spec}.ts'],
  },
});

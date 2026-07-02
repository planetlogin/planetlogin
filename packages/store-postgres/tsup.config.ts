import { defineConfig } from 'tsup';

// Compile @planetlogin/store-postgres to a single ESM bundle + bundled .d.ts.
// The core is a peer (kept external). No driver is bundled — the consumer injects
// their own pg-compatible client.
export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  target: 'node18',
  external: ['@planetlogin/core'],
});

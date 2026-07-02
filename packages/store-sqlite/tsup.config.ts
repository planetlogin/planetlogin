import { defineConfig } from 'tsup';

// Compile @planetlogin/store-sqlite to a single ESM bundle + bundled .d.ts.
// The core is a peer (kept external so there's one copy); node:sqlite is a
// builtin (auto-external).
export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  target: 'node22',
  external: ['@planetlogin/core'],
});

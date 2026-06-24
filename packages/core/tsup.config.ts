import { defineConfig } from 'tsup';

// Compile @planetlogin/core to a single ESM bundle + bundled .d.ts, so flavors
// consume built JS (no source transpilation). Runtime deps stay external.
export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm'],
  dts: true,
  clean: true,
  outDir: 'dist',
  target: 'node18',
  external: ['jose', 'hash-wasm', 'bcryptjs', '@simplewebauthn/server', 'otpauth'],
});

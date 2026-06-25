import { defineConfig } from 'vitest/config';
// Standalone so vitest doesn't walk up and pick up the hub's component
// vite.config.ts (whose test.include points at the globe's src/). The core's
// tests live in test/.
export default defineConfig({ test: { include: ['test/**/*.test.ts'] } });

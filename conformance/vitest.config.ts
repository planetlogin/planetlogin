import { defineConfig } from 'vitest/config';
// Standalone so vitest doesn't pick up the hub's component vite.config.ts.
export default defineConfig({ test: { include: ['*.test.ts'], pool: 'forks' } });

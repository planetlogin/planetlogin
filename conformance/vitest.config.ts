import { defineConfig } from 'vitest/config';
// Standalone so vitest doesn't pick up the hub's component vite.config.ts.
// The single-tenant suite only — multi-tenant runs via run-tenants.sh (its own config).
export default defineConfig({ test: { include: ['conformance.test.ts'], pool: 'forks' } });

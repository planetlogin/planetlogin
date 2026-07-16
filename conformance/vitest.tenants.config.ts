import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tenants.test.ts'], pool: 'forks' } });

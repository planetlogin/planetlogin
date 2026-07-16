// Multi-tenant config resolution: one process resolves each host's portal.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { provideTenants, resolveTenant, normalizeHost, type PlanetLoginConfig, type Tenant } from '../src/config.ts';

const cfg = (name: string): PlanetLoginConfig => ({ spec: 1, brand: { name }, providers: { password: { enabled: true } } });

describe('normalizeHost', () => {
  it('lowercases, drops the port, trims a trailing dot', () => {
    expect(normalizeHost('Acme.Example.com:8443')).toBe('acme.example.com');
    expect(normalizeHost('beta.example.com.')).toBe('beta.example.com');
    expect(normalizeHost('')).toBe('');
  });
});

describe('resolveTenant (multi-tenant)', () => {
  // Reset to single-tenant after each test by registering a no-op that the env
  // fallback path doesn't use — resolver state is module-global.
  afterEach(() => provideTenants(() => null));

  it('routes different hosts to different configs', async () => {
    const dir: Record<string, Tenant> = {
      'acme.example.com': { config: cfg('Acme') },
      'beta.example.com': { config: cfg('Beta') },
    };
    provideTenants((host) => dir[host] ?? null);

    expect((await resolveTenant('acme.example.com'))?.config.brand.name).toBe('Acme');
    expect((await resolveTenant('BETA.example.com:443'))?.config.brand.name).toBe('Beta'); // normalized
    expect(await resolveTenant('unknown.example.com')).toBeNull(); // 404 at the flavor
  });

  it('supports an async resolver and a per-tenant downstream', async () => {
    const ds: any = { findUser: async () => null };
    provideTenants(async (host) => (host === 'acme.example.com' ? { config: cfg('Acme'), downstream: ds } : null));
    const t = await resolveTenant('acme.example.com');
    expect(t?.downstream).toBe(ds);
  });

  it('rejects a malformed tenant config', async () => {
    provideTenants(() => ({ config: { spec: 2 } as any }));
    await expect(resolveTenant('x.example.com')).rejects.toThrow(/unsupported config spec/);
    provideTenants(() => ({ config: { spec: 1, brand: {} } as any }));
    await expect(resolveTenant('x.example.com')).rejects.toThrow(/brand.name is required/);
  });
});

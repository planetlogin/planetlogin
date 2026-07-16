import { readFileSync } from 'node:fs';
import { provideTenants, Downstream, type Tenant, type PlanetLoginConfig } from '@planetlogin/core';

// Built-in multi-tenant, zero code: set PLANETLOGIN_TENANTS to a JSON object (inline
// or a file path) mapping host → { config, downstream?: { url, secret } }. Each host
// then serves its own white-label config and its own account store. Unset = single
// tenant (the env PLANETLOGIN_CONFIG for every host). Bring your own resolver (a DB
// lookup) by calling provideTenants() yourself instead.
type Entry = { config: PlanetLoginConfig; downstream?: { url: string; secret: string } };

let registered = false;
export function registerEnvTenants(): void {
  if (registered) return;
  registered = true;
  const raw = process.env.PLANETLOGIN_TENANTS;
  if (!raw) return; // single-tenant

  const text = raw.trim().startsWith('{') ? raw : readFileSync(raw, 'utf8');
  const dir = JSON.parse(text) as Record<string, Entry>;
  const table = new Map<string, Tenant>();
  for (const [host, e] of Object.entries(dir)) {
    table.set(host.toLowerCase(), {
      config: e.config,
      downstream: e.downstream ? new Downstream(e.downstream.url, e.downstream.secret) : undefined,
    });
  }
  provideTenants((host) => table.get(host) ?? null);
}

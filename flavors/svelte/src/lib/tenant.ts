import { downstreamFromEnv, type Tenant } from '@planetlogin/core';

// The downstream for a tenant: its own store if multi-tenant, else the env one.
// Every route that talks to §4 goes through here so per-host isolation holds.
export const tenantDownstream = (t: Tenant) => t.downstream ?? downstreamFromEnv();

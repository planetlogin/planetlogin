// Load the white-label config + wiring from the environment (spec §5, ENV.md).
// The same config schema is what demo_admin.html edits/exports.
import { readFileSync } from 'node:fs';
import { Downstream, type DownstreamStore } from './downstream.ts';

export interface PlanetLoginConfig {
  spec: 1;
  brand: { name: string; logoUrl?: string; accent?: string; background?: string };
  providers: {
    password?: { enabled?: boolean; allowRegister?: boolean };
    oauth?: Array<{ id: string; label?: string; clientIdEnv?: string }>;
    magicLink?: { enabled?: boolean; ttlSeconds?: number };
    passkeys?: { enabled?: boolean };
    totp?: { enabled?: boolean };
    saml?: { enabled?: boolean; idpMetadataUrl?: string };
    // Anonymous/guest sessions — no account, no downstream. Mints a signed session
    // (anon:true claim). NOT authentication of a person. ttlSeconds defaults to token.ttlSeconds.
    anonymous?: { enabled?: boolean; ttlSeconds?: number };
  };
  copy?: Record<string, Record<string, string>>;
  layout?: { globePosition?: 'left' | 'right' | 'full'; showSearch?: boolean; autoSpin?: boolean };
  // Account-bound locale memory (Tier 2). Both gates default OFF (privacy-first).
  // Persistence rides the downstream contract (§4 /preferences/*) — PlanetLogin
  // stores nothing itself.
  locale?: {
    // Write the picked locale to the user's downstream record on login.
    persist?: boolean;
    // On login, fly the globe to the account's saved locale before handing off.
    flyToOnLogin?: boolean;
  };
  token?: {
    issuer?: string; audience?: string; ttlSeconds?: number;
    algorithm?: 'EdDSA' | 'RS256' | 'ES256' | 'HS256';
    // Encrypt the session token (nested JWS-in-JWE) so claims are confidential.
    // Needs PLANETLOGIN_JWT_ENCRYPT=true + a shared PLANETLOGIN_JWE_KEY (32B base64url).
    encrypt?: boolean;
  };
  session?: { store?: 'none' | 'memory' | 'redis' | 'sqlite' | 'downstream' };
  security?: {
    // Cross-origin allowlist for the auth API (exact origins, or ["*"] without
    // credentials). Maps to PLANETLOGIN_CORS_ORIGINS.
    cors?: { origins?: string[]; credentials?: boolean };
    // Per-action brute-force limits (fixed window). Needs session.store != none.
    rateLimit?: {
      login?: { limit: number; windowSeconds: number };
      magic?: { limit: number; windowSeconds: number };
      totp?: { limit: number; windowSeconds: number };
      anon?: { limit: number; windowSeconds: number };
    };
  };
}

let cfg: PlanetLoginConfig | null = null;

export function loadConfig(): PlanetLoginConfig {
  if (cfg) return cfg;
  const raw = process.env.PLANETLOGIN_CONFIG;
  if (!raw) throw new Error('PLANETLOGIN_CONFIG is required (path or inline JSON)');
  const text = raw.trim().startsWith('{') ? raw : readFileSync(raw, 'utf8');
  const parsed = JSON.parse(text) as PlanetLoginConfig;
  if (parsed.spec !== 1) throw new Error(`Unsupported config spec: ${parsed.spec}`);
  if (!parsed.brand?.name) throw new Error('config.brand.name is required');
  cfg = parsed;
  return cfg;
}

/** The public subset served at GET /auth/config (no secrets). */
export function publicConfig(c = loadConfig()) {
  return {
    spec: c.spec, brand: c.brand, providers: c.providers,
    copy: c.copy ?? {}, layout: c.layout ?? {},
    // Only the client-relevant gate (flyToOnLogin drives the post-login fly-to).
    locale: { flyToOnLogin: c.locale?.flyToOnLogin ?? false },
  };
}

export function downstreamFromEnv(): Downstream {
  const url = process.env.PLANETLOGIN_DOWNSTREAM_URL;
  const secret = process.env.PLANETLOGIN_DOWNSTREAM_SECRET;
  if (!url || !secret) throw new Error('PLANETLOGIN_DOWNSTREAM_URL and _SECRET are required');
  return new Downstream(url, secret);
}

// ── Multi-tenant: one stateless portal serving many hosts ────────────────────
// A single deployment resolves each request's config (and, optionally, its own
// downstream) from the request's host — so `acme.example.com` and `beta.example.com`
// are different portals sharing one process. Single-tenant is just "no resolver
// registered" → the env config for every host, exactly as before (non-breaking).

/** What a hostname resolves to: its white-label config, and optionally its own
 *  downstream (a per-tenant account store). Omit `downstream` to use the env one. */
export interface Tenant {
  config: PlanetLoginConfig;
  downstream?: DownstreamStore;
}

/** Resolve a request host → its tenant, or `null` for an unknown host (the flavor
 *  answers 404). May be async (a DB/directory lookup). Register it once at boot. */
export type TenantResolver = (host: string) => Tenant | null | Promise<Tenant | null>;

let tenants: TenantResolver | null = null;

/** Turn this deployment multi-tenant: resolve config/downstream per host. Without
 *  it, `resolveTenant` returns the single env config for every host. */
export function provideTenants(resolver: TenantResolver): void {
  tenants = resolver;
}

/** Normalize a Host header to a bare lowercased hostname (drop port, trim dot). */
export function normalizeHost(host: string): string {
  return String(host || '').toLowerCase().split(':')[0].replace(/\.$/, '').trim();
}

/** Resolve the tenant for a request host. Multi-tenant → the registered resolver
 *  (validated: spec 1 + brand.name); single-tenant → the env config for any host. */
export async function resolveTenant(host: string): Promise<Tenant | null> {
  if (!tenants) return { config: loadConfig() };
  const t = await tenants(normalizeHost(host));
  if (!t) return null;
  if (t.config?.spec !== 1) throw new Error(`tenant "${host}": unsupported config spec ${t.config?.spec}`);
  if (!t.config.brand?.name) throw new Error(`tenant "${host}": config.brand.name is required`);
  return t;
}

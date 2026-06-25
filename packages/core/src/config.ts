// Load the white-label config + wiring from the environment (spec §5, ENV.md).
// The same config schema is what demo_admin.html edits/exports.
import { readFileSync } from 'node:fs';
import { Downstream } from './downstream.ts';

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
  token?: { issuer?: string; audience?: string; ttlSeconds?: number; algorithm?: 'EdDSA' | 'RS256' | 'ES256' | 'HS256' };
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

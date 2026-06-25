// CORS — PlanetLogin is a stand-alone auth portal; its API is frequently called
// cross-origin (the portal on auth.example.com, the app on app.example.com) and
// it sets cookies, so credentialed CORS must be exact: reflect an ALLOWLISTED
// origin (never `*` with credentials), and always Vary: Origin.
//
// Allowlist source: config.security.cors.origins or PLANETLOGIN_CORS_ORIGINS
// (comma-separated). The literal "*" means "reflect any origin" — only valid
// WITHOUT credentials; with credentials it is treated as "no cross-origin".

export interface CorsConfig {
  /** Allowed origins, or ['*'] to reflect any. */
  origins: string[];
  /** Send Access-Control-Allow-Credentials (cookies). Default true. */
  credentials?: boolean;
}

const METHODS = 'GET, POST, OPTIONS';
const ALLOW_HEADERS = 'content-type, authorization';

/** Read the allowlist from env (flavors may merge with config). */
export function corsFromEnv(): CorsConfig {
  const raw = process.env.PLANETLOGIN_CORS_ORIGINS ?? '';
  const origins = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const credentials = process.env.PLANETLOGIN_CORS_CREDENTIALS !== 'false';
  return { origins, credentials };
}

/** Is `origin` allowed under this config? */
export function originAllowed(origin: string | null | undefined, cfg: CorsConfig): boolean {
  if (!origin) return false;
  if (cfg.origins.includes(origin)) return true;
  // "*" reflects any origin, but only when NOT sending credentials (browsers forbid
  // credentialed `*`). We reflect the concrete origin, so this stays safe.
  return cfg.origins.includes('*') && cfg.credentials === false;
}

/**
 * CORS response headers for a given request origin. Returns {} when the origin
 * isn't allowed (no CORS headers → the browser blocks the cross-origin read).
 * Always includes `Vary: Origin` so caches don't serve the wrong ACAO.
 */
export function corsHeaders(origin: string | null | undefined, cfg: CorsConfig): Record<string, string> {
  const h: Record<string, string> = { vary: 'Origin' };
  if (!originAllowed(origin, cfg)) return h;
  // With credentials we MUST echo the concrete origin, never "*".
  h['access-control-allow-origin'] = cfg.credentials === false && cfg.origins.includes('*') ? '*' : origin!;
  if (cfg.credentials !== false) h['access-control-allow-credentials'] = 'true';
  h['access-control-allow-methods'] = METHODS;
  h['access-control-allow-headers'] = ALLOW_HEADERS;
  h['access-control-max-age'] = '600';
  return h;
}

/** True for a CORS preflight (OPTIONS + Access-Control-Request-Method). */
export function isPreflight(method: string, requestMethodHeader: string | null | undefined): boolean {
  return method === 'OPTIONS' && !!requestMethodHeader;
}

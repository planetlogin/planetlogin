// Per-request: resolve which portal this host is, then apply CORS with that portal's
// allowlist. PlanetLogin is stateless and can serve many hosts from one process
// (multi-tenant) — or one (single-tenant → the env config for every host). The
// resolved tenant is stashed in event.locals for the routes.
import { json, type Handle } from '@sveltejs/kit';
import { corsHeaders, corsFromEnv, isPreflight, resolveTenant, warnIfRateLimitInert, loadConfig, type CorsConfig, type PlanetLoginConfig } from '@planetlogin/core';
import { registerEnvTenants } from '$lib/tenants';

// Multi-tenant (opt-in): if PLANETLOGIN_TENANTS is set, register the host→config
// directory. Unset → single tenant (the env config for every host).
registerEnvTenants();

// Boot-time posture check (single-tenant env): if credential providers are on but no
// store backs the rate limiter, it's inert — warn loudly so prod doesn't ship unprotected.
try {
  const p = loadConfig().providers;
  warnIfRateLimitInert({
    providersEnabled: !!(p.password?.enabled || p.magicLink?.enabled || p.totp?.enabled),
    storeKind: process.env.PLANETLOGIN_SESSION_STORE,
  });
} catch { /* config not available at import time (multi-tenant, or lazy) — skip */ }

function corsConfig(cfg: PlanetLoginConfig): CorsConfig {
  const env = corsFromEnv();
  const c = cfg.security?.cors;
  if (c?.origins?.length)
    return { origins: [...new Set([...env.origins, ...c.origins])], credentials: c.credentials ?? env.credentials };
  return env;
}

export const handle: Handle = async ({ event, resolve }) => {
  // Which portal is this host? (single-tenant → the env config; unknown host → 404)
  let tenant;
  try {
    tenant = await resolveTenant(event.url.host);
  } catch {
    return json({ error: { code: 'config_error', message: 'Portal misconfigured' } }, { status: 500 });
  }
  if (!tenant) return json({ error: { code: 'unknown_tenant', message: 'No portal for this host' } }, { status: 404 });
  event.locals.tenant = tenant;

  const origin = event.request.headers.get('origin');
  const cors = corsConfig(tenant.config);

  if (isPreflight(event.request.method, event.request.headers.get('access-control-request-method'))) {
    return new Response(null, { status: 204, headers: corsHeaders(origin, cors) });
  }

  const response = await resolve(event);
  for (const [k, v] of Object.entries(corsHeaders(origin, cors))) response.headers.set(k, v);
  return response;
};

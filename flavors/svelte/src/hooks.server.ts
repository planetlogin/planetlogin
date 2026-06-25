// CORS for the whole auth API. PlanetLogin is a stand-alone portal called
// cross-origin (portal on auth.example.com, app on app.example.com) and it sets
// cookies, so we reflect an allowlisted origin exactly and answer preflights.
// Allowlist = PLANETLOGIN_CORS_ORIGINS (env) merged with config.security.cors.
import type { Handle } from '@sveltejs/kit';
import { corsHeaders, corsFromEnv, isPreflight, loadConfig, type CorsConfig } from '@planetlogin/core';

function corsConfig(): CorsConfig {
  const env = corsFromEnv();
  try {
    const c = loadConfig().security?.cors;
    if (c?.origins?.length) {
      return { origins: [...new Set([...env.origins, ...c.origins])], credentials: c.credentials ?? env.credentials };
    }
  } catch { /* config not loaded yet — env only */ }
  return env;
}

export const handle: Handle = async ({ event, resolve }) => {
  const origin = event.request.headers.get('origin');
  const cfg = corsConfig();

  if (isPreflight(event.request.method, event.request.headers.get('access-control-request-method'))) {
    return new Response(null, { status: 204, headers: corsHeaders(origin, cfg) });
  }

  const response = await resolve(event);
  for (const [k, v] of Object.entries(corsHeaders(origin, cfg))) response.headers.set(k, v);
  return response;
};

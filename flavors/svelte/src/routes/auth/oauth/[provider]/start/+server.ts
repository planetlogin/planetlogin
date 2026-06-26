import { redirect, json, type RequestHandler } from '@sveltejs/kit';
import { loadConfig, safeReturnPath } from '@planetlogin/core';
import { getProvider, oauthStart } from '@planetlogin/core';
import { sealOAuthState } from '@planetlogin/core';

// GET /auth/oauth/{provider}/start — PKCE + state in an encrypted cookie, 302 out.
export const GET: RequestHandler = async ({ params, url, cookies }) => {
  const cfg = loadConfig();
  const provider = params.provider!;
  if (!(cfg.providers.oauth ?? []).some((o) => o.id === provider))
    return json({ error: { code: 'not_enabled', message: 'provider not enabled' } }, { status: 403 });

  const clientId = process.env[`PLANETLOGIN_OAUTH_${provider.toUpperCase()}_CLIENT_ID`];
  if (!clientId) return json({ error: { code: 'provider_error', message: 'client id not configured' } }, { status: 500 });

  const baseUrl = process.env.PLANETLOGIN_BASE_URL || url.origin;
  const redirectUri = `${baseUrl}/auth/oauth/${provider}/callback`;
  // Carry the (sanitised, same-origin) return path through the OAuth round-trip;
  // the callback prepends PLANETLOGIN_APP_ORIGIN, like the client flows do.
  const redirectTo = safeReturnPath(url.searchParams.get('return_to'), new URL(baseUrl).origin);

  const { url: authUrl, state, codeVerifier } = oauthStart(getProvider(provider), { clientId, redirectUri });
  cookies.set('pl_oauth', await sealOAuthState({ provider, state, codeVerifier, redirectTo }), {
    path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600,
  });
  throw redirect(302, authUrl);
};

import { redirect, json, type RequestHandler } from '@sveltejs/kit';
import { loadConfig } from '@planetlogin/core';
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
  const redirectTo = safePath(url.searchParams.get('return_to'), baseUrl);

  const { url: authUrl, state, codeVerifier } = oauthStart(getProvider(provider), { clientId, redirectUri });
  cookies.set('pl_oauth', await sealOAuthState({ provider, state, codeVerifier, redirectTo }), {
    path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600,
  });
  throw redirect(302, authUrl);
};

// Anti open-redirect → returns a safe same-origin PATH (always "/"-prefixed). A path
// must start with "/" but not "//" or "/\" (both fold to protocol-relative). An
// absolute URL is reduced to its path only when its parsed ORIGIN equals ours —
// never a prefix match, which "https://us.example.com@evil.com" /
// "https://us.example.com.evil.com" defeat. The caller prepends the app origin.
function safePath(to: string | null, baseUrl: string): string {
  if (!to) return '/';
  if (/^\/[^/\\]/.test(to)) return to;
  try {
    const u = new URL(to);
    if (u.origin === new URL(baseUrl).origin) return u.pathname + u.search + u.hash;
  } catch { /* not a valid absolute URL */ }
  return '/';
}

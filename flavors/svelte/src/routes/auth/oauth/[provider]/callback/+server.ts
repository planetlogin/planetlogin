import { redirect, json, type RequestHandler } from '@sveltejs/kit';
import { downstreamFromEnv } from '@planetlogin/core';
import { signSession } from '@planetlogin/core';
import { getProvider } from '@planetlogin/core';
import { openOAuthState } from '@planetlogin/core';
import { oauthCallback } from '@planetlogin/core';

// GET /auth/oauth/{provider}/callback — verify state, exchange code → session.
export const GET: RequestHandler = async ({ params, url, cookies }) => {
  const provider = params.provider!;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const raw = cookies.get('pl_oauth');
  cookies.delete('pl_oauth', { path: '/' });

  const st = raw ? await openOAuthState(raw) : null;
  if (!code || !state || !st || st.provider !== provider || st.state !== state)
    return json({ error: { code: 'provider_error', message: 'invalid oauth state' } }, { status: 400 });

  const baseUrl = process.env.PLANETLOGIN_BASE_URL || url.origin;
  const up = (s: string) => process.env[`PLANETLOGIN_OAUTH_${provider.toUpperCase()}_${s}`]!;
  const res = await oauthCallback(
    { downstream: downstreamFromEnv(), signSession },
    {
      provider, providerCfg: getProvider(provider), code, codeVerifier: st.codeVerifier,
      clientId: up('CLIENT_ID'), clientSecret: up('CLIENT_SECRET'),
      redirectUri: `${baseUrl}/auth/oauth/${provider}/callback`,
    },
  );
  if (!res.ok) return json({ error: { code: res.code, message: 'OAuth failed' } }, { status: 400 });

  cookies.set(process.env.PLANETLOGIN_COOKIE_NAME || 'planetlogin_session', res.token, {
    path: '/', httpOnly: true, secure: true, sameSite: 'lax',
  });
  throw redirect(302, st.redirectTo);
};

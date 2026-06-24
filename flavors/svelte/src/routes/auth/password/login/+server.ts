import { json, type RequestHandler } from '@sveltejs/kit';
import { downstreamFromEnv, loadConfig } from '@planetlogin/core';
import { verifyPassword } from '@planetlogin/core';
import { signSession } from '@planetlogin/core';
import { passwordLogin } from '@planetlogin/core';
import { sealEnc } from '@planetlogin/core';

// POST /auth/password/login  (openapi.yaml). Thin wrapper over the tested flow.
export const POST: RequestHandler = async ({ request, cookies }) => {
  const cfg = loadConfig();
  if (!cfg.providers.password?.enabled)
    return json({ error: { code: 'not_enabled', message: 'Password login disabled' } }, { status: 403 });

  const { identifier, password, locale } = await request.json().catch(() => ({}));
  if (!identifier || !password)
    return json({ error: { code: 'bad_request', message: 'identifier and password required' } }, { status: 400 });

  const res = await passwordLogin(
    {
      downstream: downstreamFromEnv(),
      verifyPassword,
      signSession: (c) => signSession(c, {
        issuer: cfg.token?.issuer, audience: cfg.token?.audience, ttlSeconds: cfg.token?.ttlSeconds,
      }),
    },
    { identifier, password, locale },
  );

  // 2FA required: stash a short-lived pending cookie, ask the client for the code.
  if (res.ok === 'mfa') {
    cookies.set('pl_mfa', await sealEnc({ stage: 'totp', userId: res.userId }, 300), {
      path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 300,
    });
    return json({ requires: 'totp' });
  }

  if (res.ok !== true)
    return json(
      { error: { code: res.code, message: res.code === 'downstream_unavailable' ? 'Service unavailable' : 'Invalid credentials' } },
      { status: res.code === 'downstream_unavailable' ? 503 : 401 },
    );

  cookies.set(process.env.PLANETLOGIN_COOKIE_NAME || 'planetlogin_session', res.token, {
    path: '/', httpOnly: true, secure: true, sameSite: 'lax',
  });
  return json({ token: res.token, user: res.user });
};

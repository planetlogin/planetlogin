import { json, type RequestHandler } from '@sveltejs/kit';
import { verifyResetToken, signSession, getStore } from '@planetlogin/core';
import { verifyPasswordReset } from '@planetlogin/core';
import { tenantDownstream } from '$lib/tenant';

export const POST: RequestHandler = async ({ request, cookies, locals }) => {
  const cfg = locals.tenant.config;
  const { token, password, locale } = await request.json().catch(() => ({}));
  if (!token || !password)
    return json({ error: { code: 'bad_request' } }, { status: 400 });

  const minLen = (cfg.providers.password as any)?.minPasswordLength ?? 8;
  if (String(password).length < minLen)
    return json({ error: { code: 'password_too_short' } }, { status: 400 });

  const res = await verifyPasswordReset(
    {
      downstream: tenantDownstream(locals.tenant),
      verifyResetToken,
      signSession: (c) => signSession(c, {
        issuer: cfg.token?.issuer, audience: cfg.token?.audience, ttlSeconds: cfg.token?.ttlSeconds,
      }),
      store: getStore(),
    },
    { token, password, locale },
  );

  if (!res.ok)
    return json(
      { error: { code: res.code } },
      { status: res.code === 'downstream_unavailable' ? 503 : 401 },
    );

  cookies.set(process.env.PLANETLOGIN_COOKIE_NAME || 'planetlogin_session', res.token, {
    path: '/', httpOnly: true, secure: true, sameSite: 'lax',
    domain: process.env.PLANETLOGIN_COOKIE_DOMAIN || undefined,
  });
  return json({ token: res.token, user: res.user });
};

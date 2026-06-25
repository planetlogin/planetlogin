import { json, type RequestHandler } from '@sveltejs/kit';
import { loadConfig, signSession, createAnonymousSession, getStore, rateLimit, ruleFor, rlKey } from '@planetlogin/core';

// POST /auth/anonymous {locale?} → a guest session (no account, no downstream).
// The token carries anon:true; treat it as unauthenticated for anything sensitive.
export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const cfg = loadConfig();
  if (!cfg.providers.anonymous?.enabled)
    return json({ error: { code: 'not_enabled', message: 'Anonymous sessions disabled' } }, { status: 403 });

  const rl = await rateLimit(getStore(), rlKey('anon', { ip: getClientAddress() }), ruleFor('anon', cfg.security?.rateLimit));
  if (!rl.ok)
    return json({ error: { code: 'rate_limited', message: 'Too many requests' } }, { status: 429, headers: { 'retry-after': String(rl.retryAfter) } });

  const { locale } = await request.json().catch(() => ({}));
  const res = await createAnonymousSession(
    { signSession: (c, o) => signSession(c, o) },
    { locale, ttlSeconds: cfg.providers.anonymous?.ttlSeconds ?? cfg.token?.ttlSeconds, issuer: cfg.token?.issuer, audience: cfg.token?.audience },
  );
  cookies.set(process.env.PLANETLOGIN_COOKIE_NAME || 'planetlogin_session', res.token, {
    path: '/', httpOnly: true, secure: true, sameSite: 'lax',
  });
  return json(res);
};

import { clientIp } from '$lib/clientIp';
import { json, type RequestHandler } from '@sveltejs/kit';
import { loadConfig, signSession, getStore, rateLimit, ruleFor, rlKey } from '@planetlogin/core';

// POST /auth/password/register — self-serve sign-up. Creates the account in the
// downstream (which hashes + stores the password), then auto-signs-in. Gated by
// config.providers.password.allowRegister.
export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const cfg = loadConfig();
  const pw = cfg.providers.password;
  if (!pw?.enabled || !pw?.allowRegister)
    return json({ error: { code: 'not_enabled', message: 'Registration disabled' } }, { status: 403 });

  const { email, password, name, locale } = await request.json().catch(() => ({}));
  if (!email || !password || String(password).length < 8)
    return json({ error: { code: 'bad_request', message: 'email and password (8+ chars) required' } }, { status: 400 });

  // Reuse the login brute-force rule, keyed by IP+email.
  const rl = await rateLimit(getStore(), rlKey('login', { ip: clientIp({ request, getClientAddress }), identifier: String(email) }), ruleFor('login', cfg.security?.rateLimit));
  if (!rl.ok)
    return json({ error: { code: 'rate_limited', message: 'Too many attempts, try again later' } }, { status: 429, headers: { 'retry-after': String(rl.retryAfter) } });

  // Create the account downstream (it owns password storage; hashes argon2id).
  const url = process.env.PLANETLOGIN_DOWNSTREAM_URL;
  const secret = process.env.PLANETLOGIN_DOWNSTREAM_SECRET;
  if (!url || !secret)
    return json({ error: { code: 'downstream_unavailable', message: 'Service unavailable' } }, { status: 503 });

  let res: Response;
  try {
    res = await fetch(url.replace(/\/$/, '') + '/users/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` },
      body: JSON.stringify({ email, password, name }),
    });
  } catch {
    return json({ error: { code: 'downstream_unavailable', message: 'Service unavailable' } }, { status: 503 });
  }
  if (res.status === 409)
    return json({ error: { code: 'email_taken', message: 'That email is already registered' } }, { status: 409 });
  if (!res.ok)
    return json({ error: { code: 'bad_request', message: 'Could not create the account' } }, { status: 400 });
  const user = (await res.json()) as { id: string; email?: string; name?: string };

  // Auto sign-in: mint a session and set the cookie, exactly like login.
  const token = await signSession(
    { sub: user.id, email: user.email, name: user.name, locale },
    { issuer: cfg.token?.issuer, audience: cfg.token?.audience, ttlSeconds: cfg.token?.ttlSeconds },
  );
  cookies.set(process.env.PLANETLOGIN_COOKIE_NAME || 'planetlogin_session', token, {
    path: '/', httpOnly: true, secure: true, sameSite: 'lax',
    domain: process.env.PLANETLOGIN_COOKIE_DOMAIN || undefined,
  });
  return json({ token, user });
};

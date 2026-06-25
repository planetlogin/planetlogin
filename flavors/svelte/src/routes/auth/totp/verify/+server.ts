import { json, type RequestHandler } from '@sveltejs/kit';
import { downstreamFromEnv, loadConfig } from '@planetlogin/core';
import { signSession } from '@planetlogin/core';
import { totpVerify } from '@planetlogin/core';
import { openEnc, getStore, rateLimit, ruleFor, rlKey } from '@planetlogin/core';

// POST /auth/totp/verify {code, identifier?}
//   - with a pending login (pl_mfa cookie) → verify → session
//   - else (enrollment confirm) → verify by identifier → { ok }
export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
  const cfg = loadConfig();
  if (!cfg.providers.totp?.enabled) return json({ error: { code: 'not_enabled', message: '2FA disabled' } }, { status: 403 });
  const { identifier, code } = await request.json().catch(() => ({}));
  if (!code) return json({ error: { code: 'bad_request', message: 'code required' } }, { status: 400 });

  // Throttle code-guessing (no-op until session.store is set). Keyed by IP+id.
  const rl = await rateLimit(getStore(), rlKey('totp', { ip: getClientAddress(), identifier }), ruleFor('totp', cfg.security?.rateLimit));
  if (!rl.ok) return json({ error: { code: 'rate_limited', message: 'Too many attempts, try again later' } }, { status: 429, headers: { 'retry-after': String(rl.retryAfter) } });

  const ds = downstreamFromEnv();

  const raw = cookies.get('pl_mfa');
  if (raw) {
    cookies.delete('pl_mfa', { path: '/' });
    const st = await openEnc<any>(raw);
    if (!st?.userId) return json({ error: { code: 'invalid_token', message: 'no pending login' } }, { status: 400 });
    const r = await totpVerify({ downstream: ds }, { userId: st.userId, code });
    if (!r.ok) return json({ error: { code: 'invalid_credentials', message: 'bad code' } }, { status: 401 });
    const token = await signSession({ sub: st.userId }, { issuer: cfg.token?.issuer, audience: cfg.token?.audience, ttlSeconds: cfg.token?.ttlSeconds });
    cookies.set(process.env.PLANETLOGIN_COOKIE_NAME || 'planetlogin_session', token, { path: '/', httpOnly: true, secure: true, sameSite: 'lax' });
    return json({ token, user: { id: st.userId } });
  }

  if (!identifier) return json({ error: { code: 'bad_request', message: 'identifier required' } }, { status: 400 });
  const user = await ds.findUser(identifier);
  if (!user) return json({ error: { code: 'invalid_credentials', message: 'unknown user' } }, { status: 401 });
  const r = await totpVerify({ downstream: ds }, { userId: user.id, code });
  return r.ok ? json({ ok: true }) : json({ error: { code: 'invalid_credentials', message: 'bad code' } }, { status: 401 });
};

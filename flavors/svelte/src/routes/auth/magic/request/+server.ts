import { json, type RequestHandler } from '@sveltejs/kit';
import { downstreamFromEnv, loadConfig } from '@planetlogin/core';
import { signMagicToken } from '@planetlogin/core';
import { requestMagicLink } from '@planetlogin/core';
import { getStore, rateLimit, ruleFor, rlKey } from '@planetlogin/core';

// POST /auth/magic/request — always 202 (no account enumeration).
export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
  const cfg = loadConfig();
  if (!cfg.providers.magicLink?.enabled)
    return json({ error: { code: 'not_enabled', message: 'Magic link disabled' } }, { status: 403 });
  const { identifier, locale } = await request.json().catch(() => ({}));
  if (!identifier) return json({ error: { code: 'bad_request', message: 'identifier required' } }, { status: 400 });

  // Throttle by IP only (never by identifier — that would let an attacker lock a
  // victim's mailbox). No-op until session.store is configured.
  const rl = await rateLimit(getStore(), rlKey('magic', { ip: getClientAddress() }), ruleFor('magic', cfg.security?.rateLimit));
  if (!rl.ok)
    return json({ error: { code: 'rate_limited', message: 'Too many requests, try again later' } }, { status: 429, headers: { 'retry-after': String(rl.retryAfter) } });

  await requestMagicLink(
    { downstream: downstreamFromEnv(), signMagicToken: (id) => signMagicToken(id, cfg.providers.magicLink?.ttlSeconds) },
    { identifier, baseUrl: process.env.PLANETLOGIN_BASE_URL || url.origin, locale },
  );
  return new Response(null, { status: 202 });
};

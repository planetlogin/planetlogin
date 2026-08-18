import { clientIp } from '$lib/clientIp';
import { json, type RequestHandler } from '@sveltejs/kit';
import { signResetToken, getStore, rateLimit, ruleFor, rlKey } from '@planetlogin/core';
import { requestPasswordReset } from '@planetlogin/core';
import { tenantDownstream } from '$lib/tenant';

export const POST: RequestHandler = async ({ request, url, getClientAddress, locals }) => {
  const cfg = locals.tenant.config;
  if (!cfg.providers.password?.enabled)
    return json({ error: { code: 'not_enabled' } }, { status: 403 });

  const { identifier, locale } = await request.json().catch(() => ({}));
  if (!identifier)
    return json({ error: { code: 'bad_request' } }, { status: 400 });

  const rl = await rateLimit(getStore(), rlKey('magic', { ip: clientIp({ request, getClientAddress }) }), ruleFor('magic', cfg.security?.rateLimit));
  if (!rl.ok)
    return json({ error: { code: 'rate_limited' } }, { status: 429, headers: { 'retry-after': String(rl.retryAfter) } });

  const ds = tenantDownstream(locals.tenant);
  const ttl = (cfg.providers.password as any)?.resetTokenTtlSeconds ?? 3600;
  await requestPasswordReset(
    {
      downstream: ds,
      signResetToken: (userId, email) => signResetToken(userId, email, ttl),
      deliverReset: (data) => ds.deliverReset(data),
    },
    { identifier, baseUrl: process.env.PLANETLOGIN_BASE_URL || url.origin, locale },
  );
  return new Response(null, { status: 202 });
};

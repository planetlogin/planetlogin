import { json, type RequestHandler } from '@sveltejs/kit';
import { totpEnroll } from '@planetlogin/core';
import { tenantDownstream } from '$lib/tenant';

// POST /auth/totp/enroll {identifier} → { uri, secret } (show the QR from uri).
export const POST: RequestHandler = async ({ request, locals }) => {
  const cfg = locals.tenant.config;
  if (!cfg.providers.totp?.enabled) return json({ error: { code: 'not_enabled', message: '2FA disabled' } }, { status: 403 });
  const { identifier } = await request.json().catch(() => ({}));
  if (!identifier) return json({ error: { code: 'bad_request', message: 'identifier required' } }, { status: 400 });
  const ds = tenantDownstream(locals.tenant);
  const user = await ds.findUser(identifier);
  if (!user) return json({ error: { code: 'invalid_credentials', message: 'unknown user' } }, { status: 401 });
  return json(await totpEnroll({ downstream: ds }, { userId: user.id, label: identifier, issuer: cfg.brand.name }));
};

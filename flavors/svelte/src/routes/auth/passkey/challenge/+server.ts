import { json, type RequestHandler } from '@sveltejs/kit';
import { registrationOptions, authenticationOptions } from '@planetlogin/core';
import { sealEnc } from '@planetlogin/core';
import { tenantDownstream } from '$lib/tenant';

// POST /auth/passkey/challenge {mode:'register'|'auth', identifier?}
export const POST: RequestHandler = async ({ request, url, cookies, locals }) => {
  const cfg = locals.tenant.config;
  if (!cfg.providers.passkeys?.enabled)
    return json({ error: { code: 'not_enabled', message: 'passkeys disabled' } }, { status: 403 });

  const { mode, identifier } = await request.json().catch(() => ({}));
  const baseUrl = process.env.PLANETLOGIN_BASE_URL || url.origin;
  const rpID = new URL(baseUrl).hostname;
  const rpName = cfg.brand.name;

  if (mode === 'register') {
    if (!identifier) return json({ error: { code: 'bad_request', message: 'identifier required' } }, { status: 400 });
    const ds = tenantDownstream(locals.tenant);
    const user = await ds.findUser(identifier);
    if (!user) return json({ error: { code: 'invalid_credentials', message: 'unknown user' } }, { status: 401 });
    const existing = (await ds.passkeysFind({ userId: user.id }))?.credentials ?? [];
    const options = await registrationOptions({ rpID, rpName, userId: user.id, userName: identifier, existing });
    cookies.set('pl_webauthn', await sealEnc({ mode, challenge: options.challenge, userId: user.id, origin: baseUrl, rpID }, 300),
      { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 300 });
    return json(options);
  }
  // auth (usernameless)
  const options = await authenticationOptions({ rpID });
  cookies.set('pl_webauthn', await sealEnc({ mode: 'auth', challenge: options.challenge, origin: baseUrl, rpID }, 300),
    { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: 300 });
  return json(options);
};

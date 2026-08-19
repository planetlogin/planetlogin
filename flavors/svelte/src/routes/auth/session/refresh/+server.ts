import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resolveTenant, normalizeHost, verifySession, signSession } from '@planetlogin/core';

export const POST: RequestHandler = async ({ request, cookies }) => {
  const host = normalizeHost(request.headers.get('host') ?? '');
  const tenant = await resolveTenant(host);
  if (!tenant) return json({ error: 'unknown_tenant' }, { status: 404 });
  const cfg = tenant.config;

  const token = cookies.get('pl_session');
  if (!token) return json({ error: 'no_session' }, { status: 401 });

  let payload;
  try {
    payload = await verifySession(token);
  } catch {
    return json({ error: 'invalid_session' }, { status: 401 });
  }

  const ttl = cfg.token?.ttlSeconds ?? 3600;
  const fresh = await signSession({
    sub: payload.sub as string,
    email: (payload.email as string) ?? '',
    name: (payload.name as string) ?? '',
    locale: (payload.locale as string) ?? undefined,
  }, ttl);

  cookies.set('pl_session', fresh, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: ttl,
  });

  return json({ ok: true, token: fresh });
};

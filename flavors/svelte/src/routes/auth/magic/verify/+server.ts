import { json, type RequestHandler } from '@sveltejs/kit';
import { downstreamFromEnv } from '@planetlogin/core';
import { getStore } from '@planetlogin/core';
import { verifyMagicToken, signSession } from '@planetlogin/core';
import { verifyMagicLink } from '@planetlogin/core';

// GET /auth/magic/verify?token= — verify the link → session.
export const GET: RequestHandler = async ({ url, cookies }) => {
  const token = url.searchParams.get('token');
  if (!token) return json({ error: { code: 'invalid_token', message: 'No token' } }, { status: 401 });
  const res = await verifyMagicLink({ downstream: downstreamFromEnv(), verifyMagicToken, signSession, store: getStore() }, { token });
  if (!res.ok) return json({ error: { code: res.code, message: 'Invalid or expired link' } }, { status: 401 });
  cookies.set(process.env.PLANETLOGIN_COOKIE_NAME || 'planetlogin_session', res.token, {
    path: '/', httpOnly: true, secure: true, sameSite: 'lax',
  });
  return json({ token: res.token, user: res.user });
};

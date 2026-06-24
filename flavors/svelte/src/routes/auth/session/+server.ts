import { json, type RequestHandler } from '@sveltejs/kit';
import { verifySession } from '@planetlogin/core';
// GET /auth/session — validate the current token → claims, or 401.
export const GET: RequestHandler = async ({ request, cookies }) => {
  const bearer = request.headers.get('authorization')?.replace(/^Bearer /, '');
  const token = bearer || cookies.get(process.env.PLANETLOGIN_COOKIE_NAME || 'planetlogin_session');
  if (!token) return json({ error: { code: 'invalid_token', message: 'No session' } }, { status: 401 });
  try {
    return json(await verifySession(token));
  } catch {
    return json({ error: { code: 'invalid_token', message: 'Invalid session' } }, { status: 401 });
  }
};

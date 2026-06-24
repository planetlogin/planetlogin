import { json, type RequestHandler } from '@sveltejs/kit';

// POST /auth/logout — clear the session cookie. The token itself is stateless;
// for hard revocation, enable a session.store denylist downstream (spec §8).
export const POST: RequestHandler = async ({ cookies }) => {
  cookies.delete(process.env.PLANETLOGIN_COOKIE_NAME || 'planetlogin_session', { path: '/' });
  return json({ ok: true });
};

import { json, type RequestHandler } from '@sveltejs/kit';
import { verifySession, downstreamFromEnv, getPreferences, savePreferences } from '@planetlogin/core';

// GET/PUT /auth/preferences — the user's own locale + open data bag (spec §4).
// Session-gated: the bearer/cookie JWT identifies the user; we never trust a
// userId from the body. Stateless — persistence is the downstream's.
async function sessionUserId(request: Request, token: string | undefined): Promise<string | null> {
  const bearer = request.headers.get('authorization')?.replace(/^Bearer /, '');
  const t = bearer || token;
  if (!t) return null;
  try { return (await verifySession(t)).sub as string; } catch { return null; }
}

const cookieName = () => process.env.PLANETLOGIN_COOKIE_NAME || 'planetlogin_session';

export const GET: RequestHandler = async ({ request, cookies }) => {
  const sub = await sessionUserId(request, cookies.get(cookieName()));
  if (!sub) return json({ error: { code: 'invalid_token', message: 'No session' } }, { status: 401 });
  return json(await getPreferences({ downstream: downstreamFromEnv() }, { userId: sub }));
};

export const PUT: RequestHandler = async ({ request, cookies }) => {
  const sub = await sessionUserId(request, cookies.get(cookieName()));
  if (!sub) return json({ error: { code: 'invalid_token', message: 'No session' } }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const r = await savePreferences({ downstream: downstreamFromEnv() }, { userId: sub, locale: body.locale, data: body.data });
  return json(r);
};

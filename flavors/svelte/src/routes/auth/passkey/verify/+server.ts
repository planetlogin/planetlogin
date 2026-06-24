import { json, type RequestHandler } from '@sveltejs/kit';
import { downstreamFromEnv } from '@planetlogin/core';
import { signSession } from '@planetlogin/core';
import { verifyRegistration, verifyAuthentication } from '@planetlogin/core';
import { passkeyRegisterVerify, passkeyAuthVerify } from '@planetlogin/core';
import { openEnc } from '@planetlogin/core';

// POST /auth/passkey/verify {mode, response}
export const POST: RequestHandler = async ({ request, cookies }) => {
  const { response } = await request.json().catch(() => ({}));
  const raw = cookies.get('pl_webauthn');
  cookies.delete('pl_webauthn', { path: '/' });
  const st = raw ? await openEnc<any>(raw) : null;
  if (!st || !response) return json({ error: { code: 'invalid_token', message: 'no challenge' } }, { status: 400 });

  if (st.mode === 'register') {
    const res = await passkeyRegisterVerify(
      { downstream: downstreamFromEnv(), verifyRegistration },
      { response, expectedChallenge: st.challenge, userId: st.userId, origin: st.origin, rpID: st.rpID },
    );
    return res.ok ? json({ ok: true }) : json({ error: { code: res.code, message: 'registration failed' } }, { status: 401 });
  }

  const res = await passkeyAuthVerify(
    { downstream: downstreamFromEnv(), verifyAuthentication, signSession },
    { response, expectedChallenge: st.challenge, origin: st.origin, rpID: st.rpID },
  );
  if (!res.ok) return json({ error: { code: res.code, message: 'authentication failed' } }, { status: 401 });
  cookies.set(process.env.PLANETLOGIN_COOKIE_NAME || 'planetlogin_session', res.token,
    { path: '/', httpOnly: true, secure: true, sameSite: 'lax' });
  return json({ token: res.token, user: res.user });
};

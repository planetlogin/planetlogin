// PlanetLogin — vanilla Node flavor. NO framework: a plain http() server that
// consumes @planetlogin/core (the shared auth logic) and adds only the HTTP binding.
// Proves the "flavor" model: contract + conformance suite are the constant; the HTTP
// layer changes per runtime. Run: `npm start`. Passes the same conformance suite.
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import {
  loadConfig, publicConfig, downstreamFromEnv,
  jwks, signSession, verifySession, signMagicToken, verifyMagicToken,
  verifyPassword, getStore,
  passwordLogin, requestMagicLink, verifyMagicLink, totpEnroll, totpVerify,
  corsHeaders, corsFromEnv, isPreflight, rateLimit, ruleFor, rlKey,
  getPreferences, savePreferences,
} from '@planetlogin/core';

const PORT = Number(process.env.PORT) || 8810;
const COOKIE = process.env.PLANETLOGIN_COOKIE_NAME || 'planetlogin_session';
const baseUrl = () => process.env.PLANETLOGIN_BASE_URL || `http://127.0.0.1:${PORT}`;
const tokenOpts = () => {
  const t = loadConfig().token ?? {};
  return { issuer: t.issuer, audience: t.audience, ttlSeconds: t.ttlSeconds };
};

const send = (res: ServerResponse, status: number, obj?: unknown, headers: Record<string, string> = {}) => {
  res.writeHead(status, { 'content-type': 'application/json', ...headers });
  res.end(obj === undefined ? '' : JSON.stringify(obj));
};
const err = (res: ServerResponse, status: number, code: string, message: string) => send(res, status, { error: { code, message } }, status);
const body = (req: IncomingMessage) =>
  new Promise<any>((resolve) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => resolve(b ? JSON.parse(b) : {})); });
const cookie = (req: IncomingMessage, name: string) =>
  (req.headers.cookie ?? '').split(';').map((c) => c.trim().split('=')).find(([k]) => k === name)?.[1];
// Client IP: trust X-Forwarded-For only when behind a known proxy (env opt-in).
const clientIp = (req: IncomingMessage) =>
  (process.env.PLANETLOGIN_TRUST_PROXY === 'true' && (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim())
  || req.socket.remoteAddress || null;
const setCookie = (val: string, maxAge?: number) =>
  ({ 'set-cookie': `${COOKIE}=${val}; Path=/; HttpOnly; Secure; SameSite=Lax${maxAge ? `; Max-Age=${maxAge}` : ''}` });

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', baseUrl());
    const p = url.pathname, m = req.method ?? 'GET';
    const cfg = loadConfig();

    // CORS: set allowlisted headers on every response; short-circuit preflights.
    const origin = (req.headers.origin as string) ?? null;
    const cors = corsHeaders(origin, corsFromEnv());
    for (const [k, v] of Object.entries(cors)) res.setHeader(k, v);
    if (isPreflight(m, (req.headers['access-control-request-method'] as string) ?? null)) {
      res.writeHead(204); return res.end();
    }

    if (p === '/auth/config' && m === 'GET') return send(res, 200, publicConfig(cfg));
    if (p === '/auth/.well-known/jwks.json' && m === 'GET') return send(res, 200, await jwks());

    if (p === '/auth/session' && m === 'GET') {
      const tok = (req.headers.authorization ?? '').replace(/^Bearer /, '') || cookie(req, COOKIE);
      if (!tok) return err(res, 401, 'invalid_token', 'no token');
      try { return send(res, 200, { claims: await verifySession(tok) }); }
      catch { return err(res, 401, 'invalid_token', 'bad token'); }
    }

    if (p === '/auth/password/login' && m === 'POST') {
      if (!cfg.providers.password?.enabled) return err(res, 403, 'not_enabled', 'disabled');
      const { identifier, password, locale } = await body(req);
      if (!identifier || !password) return err(res, 400, 'bad_request', 'identifier and password required');
      const rl = await rateLimit(getStore(), rlKey('login', { ip: clientIp(req), identifier }), ruleFor('login', cfg.security?.rateLimit));
      if (!rl.ok) return send(res, 429, { error: { code: 'rate_limited', message: 'Too many attempts' } }, { 'retry-after': String(rl.retryAfter) });
      const r = await passwordLogin(
        { downstream: downstreamFromEnv(), verifyPassword, signSession: (c) => signSession(c, tokenOpts()) },
        { identifier, password, locale },
      );
      if (r.ok === 'mfa') return send(res, 200, { requires: 'totp' }); // (vanilla: stateless demo — client re-sends identifier to /totp/verify)
      if (r.ok !== true) return err(res, r.code === 'downstream_unavailable' ? 503 : 401, r.code, 'login failed');
      // Tier 2 (gate A): persist the picked locale to the account. Best-effort.
      if (cfg.locale?.persist && locale)
        await savePreferences({ downstream: downstreamFromEnv() }, { userId: r.user.id, locale }).catch(() => {});
      return send(res, 200, { token: r.token, user: r.user }, setCookie(r.token));
    }

    // GET/PUT /auth/preferences — the session user's locale + open data bag (§4).
    if (p === '/auth/preferences' && (m === 'GET' || m === 'PUT')) {
      const tok = (req.headers.authorization ?? '').replace(/^Bearer /, '') || cookie(req, COOKIE);
      let userId: string;
      try { userId = (await verifySession(tok ?? '')).sub as string; }
      catch { return err(res, 401, 'invalid_token', 'no session'); }
      if (m === 'GET') return send(res, 200, await getPreferences({ downstream: downstreamFromEnv() }, { userId }));
      const { locale, data } = await body(req);
      return send(res, 200, await savePreferences({ downstream: downstreamFromEnv() }, { userId, locale, data }));
    }

    if (p === '/auth/magic/request' && m === 'POST') {
      if (!cfg.providers.magicLink?.enabled) return err(res, 403, 'not_enabled', 'disabled');
      const { identifier, locale } = await body(req);
      if (!identifier) return err(res, 400, 'bad_request', 'identifier required');
      const rl = await rateLimit(getStore(), rlKey('magic', { ip: clientIp(req) }), ruleFor('magic', cfg.security?.rateLimit));
      if (!rl.ok) return send(res, 429, { error: { code: 'rate_limited', message: 'Too many requests' } }, { 'retry-after': String(rl.retryAfter) });
      await requestMagicLink({ downstream: downstreamFromEnv(), signMagicToken }, { identifier, baseUrl: baseUrl(), locale });
      return send(res, 202, { accepted: true });
    }
    if (p === '/auth/magic/verify' && (m === 'POST' || m === 'GET')) {
      const token = m === 'GET' ? url.searchParams.get('token') ?? '' : (await body(req)).token;
      const r = await verifyMagicLink(
        { verifyMagicToken, downstream: downstreamFromEnv(), store: getStore(), signSession: (c) => signSession(c, tokenOpts()) },
        { token },
      );
      if (!r.ok) return err(res, 401, r.code, 'invalid link');
      return send(res, 200, { token: r.token, user: r.user }, setCookie(r.token));
    }

    if (p === '/auth/totp/enroll' && m === 'POST') {
      if (!cfg.providers.totp?.enabled) return err(res, 403, 'not_enabled', 'disabled');
      const { identifier } = await body(req);
      const ds = downstreamFromEnv();
      const user = await ds.findUser(identifier);
      if (!user) return err(res, 401, 'invalid_credentials', 'unknown user');
      return send(res, 200, await totpEnroll({ downstream: ds }, { userId: user.id, label: identifier, issuer: cfg.brand.name }));
    }
    if (p === '/auth/totp/verify' && m === 'POST') {
      if (!cfg.providers.totp?.enabled) return err(res, 403, 'not_enabled', 'disabled');
      const { identifier, code } = await body(req);
      const rl = await rateLimit(getStore(), rlKey('totp', { ip: clientIp(req), identifier }), ruleFor('totp', cfg.security?.rateLimit));
      if (!rl.ok) return send(res, 429, { error: { code: 'rate_limited', message: 'Too many attempts' } }, { 'retry-after': String(rl.retryAfter) });
      const ds = downstreamFromEnv();
      const user = await ds.findUser(identifier);
      if (!user) return err(res, 401, 'invalid_credentials', 'unknown user');
      const r = await totpVerify({ downstream: ds }, { userId: user.id, code });
      return r.ok ? send(res, 200, { ok: true }) : err(res, 401, 'invalid_credentials', 'bad code');
    }

    return err(res, 404, 'not_found', `no route for ${m} ${p}`);
  } catch (e) {
    return err(res, 500, 'internal', (e as Error).message);
  }
});

server.listen(PORT, () => console.log(`[planetlogin-vanilla] listening on ${baseUrl()}`));

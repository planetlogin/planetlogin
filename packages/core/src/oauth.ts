// OAuth2 authorization-code + PKCE (RFC 6749 + 7636). Standard HTTP + a SHA-256
// PKCE challenge (node crypto) — no hand-rolled crypto. Provider endpoints come
// from a small registry, overridable by env (self-host quirks / a generic/mock
// provider). For production breadth, arctic / openid-client drop in behind the
// same ProviderConfig shape.
import { createHash, randomBytes } from 'node:crypto';

export interface ProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  scopes: string[];
  mapProfile: (raw: any) => { providerUserId: string; email?: string; name?: string };
}

const b64url = (b: Buffer) => b.toString('base64url');

export function pkcePair() {
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

const REGISTRY: Record<string, ProviderConfig> = {
  google: {
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userinfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scopes: ['openid', 'email', 'profile'],
    mapProfile: (r) => ({ providerUserId: r.sub, email: r.email, name: r.name }),
  },
  github: {
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userinfoUrl: 'https://api.github.com/user',
    scopes: ['read:user', 'user:email'],
    mapProfile: (r) => ({ providerUserId: String(r.id), email: r.email, name: r.name || r.login }),
  },
};

/** Resolve a provider config. Endpoints are overridable per provider via env
 *  (PLANETLOGIN_OAUTH_<ID>_{AUTHORIZE,TOKEN,USERINFO}_URL). Unknown ids become a
 *  generic OIDC-shaped provider built entirely from those env vars. */
export function getProvider(id: string): ProviderConfig {
  const env = (s: string) => process.env[`PLANETLOGIN_OAUTH_${id.toUpperCase()}_${s}`];
  const base = REGISTRY[id] ?? {
    authorizeUrl: env('AUTHORIZE_URL') || '',
    tokenUrl: env('TOKEN_URL') || '',
    userinfoUrl: env('USERINFO_URL') || '',
    scopes: (env('SCOPES') || 'openid email profile').split(' '),
    mapProfile: (r: any) => ({ providerUserId: r.sub ?? String(r.id), email: r.email, name: r.name }),
  };
  return {
    ...base,
    authorizeUrl: env('AUTHORIZE_URL') || base.authorizeUrl,
    tokenUrl: env('TOKEN_URL') || base.tokenUrl,
    userinfoUrl: env('USERINFO_URL') || base.userinfoUrl,
  };
}

export function buildAuthUrl(p: ProviderConfig, a: { clientId: string; redirectUri: string; state: string; challenge: string }): string {
  const u = new URL(p.authorizeUrl);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', a.clientId);
  u.searchParams.set('redirect_uri', a.redirectUri);
  u.searchParams.set('scope', p.scopes.join(' '));
  u.searchParams.set('state', a.state);
  u.searchParams.set('code_challenge', a.challenge);
  u.searchParams.set('code_challenge_method', 'S256');
  return u.toString();
}

/** /start helper: PKCE pair + state + the authorization URL. */
export function oauthStart(p: ProviderConfig, a: { clientId: string; redirectUri: string }) {
  const { verifier, challenge } = pkcePair();
  const state = b64url(randomBytes(16));
  return { url: buildAuthUrl(p, { ...a, state, challenge }), state, codeVerifier: verifier };
}

export async function exchangeCode(
  p: ProviderConfig,
  a: { clientId: string; clientSecret: string; code: string; codeVerifier: string; redirectUri: string },
): Promise<string> {
  const res = await fetch(p.tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'authorization_code', code: a.code, redirect_uri: a.redirectUri,
      client_id: a.clientId, client_secret: a.clientSecret, code_verifier: a.codeVerifier,
    }),
  });
  if (!res.ok) throw new Error(`token exchange → ${res.status}`);
  const tok = await res.json();
  if (!tok.access_token) throw new Error('no access_token');
  return tok.access_token as string;
}

export async function fetchProfile(p: ProviderConfig, accessToken: string) {
  const res = await fetch(p.userinfoUrl, {
    headers: { authorization: `Bearer ${accessToken}`, accept: 'application/json', 'user-agent': 'planetlogin' },
  });
  if (!res.ok) throw new Error(`userinfo → ${res.status}`);
  return p.mapProfile(await res.json());
}

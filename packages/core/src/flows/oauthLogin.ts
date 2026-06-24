// OAuth callback flow (spec §3 /auth/oauth/{provider}/callback). Exchange the
// code, fetch the profile, upsert the user DOWNSTREAM by (provider, providerUserId)
// — the canonical link; the integrator decides account-linking — then mint a
// session. Pure/injectable; nothing stored here.
import type { Downstream } from '../downstream.ts';
import type { Locale, SessionClaims } from '../jwt.ts';
import { exchangeCode, fetchProfile, type ProviderConfig } from '../oauth.ts';

export interface OAuthLoginDeps {
  downstream: Downstream;
  signSession: (claims: SessionClaims) => Promise<string>;
}

export interface OAuthLoginInput {
  provider: string;
  providerCfg: ProviderConfig;
  code: string;
  codeVerifier: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  locale?: Locale;
}

export type OAuthLoginResult =
  | { ok: true; token: string; user: { id: string; email?: string; name?: string } }
  | { ok: false; code: 'provider_error' };

export async function oauthCallback(deps: OAuthLoginDeps, input: OAuthLoginInput): Promise<OAuthLoginResult> {
  try {
    const accessToken = await exchangeCode(input.providerCfg, {
      clientId: input.clientId, clientSecret: input.clientSecret,
      code: input.code, codeVerifier: input.codeVerifier, redirectUri: input.redirectUri,
    });
    const id = await fetchProfile(input.providerCfg, accessToken);
    if (!id.providerUserId) return { ok: false, code: 'provider_error' };

    const user = await deps.downstream.upsertUser({
      provider: input.provider, providerUserId: id.providerUserId, email: id.email, name: id.name,
    });
    if (!user) return { ok: false, code: 'provider_error' };

    const token = await deps.signSession({
      sub: user.id, email: user.email ?? id.email, name: user.name ?? id.name, locale: input.locale,
    });
    return { ok: true, token, user: { id: user.id, email: user.email, name: user.name } };
  } catch {
    return { ok: false, code: 'provider_error' };
  }
}

// Downstream identity client (spec §4). PlanetLogin stores nothing — it calls the
// integrator's REST store for every read/write. Fails closed (deny) on error.
import type { Locale } from './jwt.ts';

export interface DownstreamUser {
  id: string;
  email?: string;
  name?: string;
  passwordHash?: string; // argon2id encoded; PlanetLogin verifies it locally
  locale?: Locale;
  totpEnabled?: boolean; // if true, password login requires a 2FA step
}

/** Per-user, dev-owned preferences (spec §4). `locale` is the typed, first-class
 *  piece PlanetLogin reads/writes (fly-to + i18n); `data` is an open bag the
 *  integrator can store any "that kind of info" in. */
export interface UserPreferences {
  locale?: Locale;
  data?: Record<string, unknown>;
}

export class Downstream {
  constructor(
    private baseUrl: string,
    private secret: string,
    private timeoutMs = Number(process.env.PLANETLOGIN_DOWNSTREAM_TIMEOUT_MS) || 5000,
    private fetchImpl: typeof fetch = fetch,
  ) {}

  private async call<T>(path: string, body: unknown): Promise<T | null> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      const res = await this.fetchImpl(this.baseUrl.replace(/\/$/, '') + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${this.secret}` },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`downstream ${path} → ${res.status}`);
      const text = await res.text();
      return (text ? JSON.parse(text) : null) as T; // tolerate empty 201/204 bodies
    } finally {
      clearTimeout(timer);
    }
  }

  findUser(identifier: string): Promise<DownstreamUser | null> {
    return this.call<DownstreamUser>('/users/find', { identifier });
  }

  upsertUser(data: {
    provider: string; providerUserId?: string; email?: string; name?: string; profile?: unknown;
  }): Promise<DownstreamUser | null> {
    return this.call<DownstreamUser>('/users/upsert', data);
  }

  /** Ask the integrator to deliver a magic link (it sends the email/SMS). */
  deliverMagic(data: { identifier: string; link: string; locale?: Locale }): Promise<unknown> {
    return this.call('/magic/deliver', data);
  }

  /** Passkeys (spec §4): the integrator stores WebAuthn credentials. */
  passkeysFind(query: { userId?: string; credentialId?: string }): Promise<{ userId: string; credentials: any[] } | null> {
    return this.call('/passkeys/find', query);
  }
  passkeysSave(data: { userId: string; credential: any }): Promise<unknown> {
    return this.call('/passkeys/save', data);
  }

  /** TOTP (2FA): the integrator stores the per-user secret + enabled flag. */
  totpGet(query: { userId: string }): Promise<{ secret: string; enabled: boolean } | null> {
    return this.call('/totp/find', query);
  }
  totpSave(data: { userId: string; secret: string; enabled: boolean }): Promise<unknown> {
    return this.call('/totp/save', data);
  }

  /** Preferences (spec §4): per-user locale + open data bag. Null when none. */
  preferencesGet(query: { userId: string }): Promise<UserPreferences | null> {
    return this.call<UserPreferences>('/preferences/find', query);
  }
  preferencesSave(data: { userId: string } & UserPreferences): Promise<unknown> {
    return this.call('/preferences/save', data);
  }
}

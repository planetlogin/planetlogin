// The downstream store (spec §4). PlanetLogin stores nothing — it reads/writes
// the integrator's store for every operation, and fails closed (deny) on error.
//
// `DownstreamStore` is the CONTRACT (an interface). There are two ways to provide
// it, same shape, your choice:
//   • HTTP: `new Downstream(url, secret)` — a separate service, multi-service auth.
//   • IN-PROCESS: `defineStore({ findUser: (id) => db.query(...) , ... })` — talk to
//     your DB directly from the same app (a SvelteKit monolith), no REST, no hop.
// The auth flows take a `DownstreamStore`, so either works identically.
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

/** The §4 contract. Implement it in-process (DB calls) or use the HTTP `Downstream`.
 *  Only the methods your enabled providers need are ever called. */
export interface DownstreamStore {
  findUser(identifier: string): Promise<DownstreamUser | null>;
  upsertUser(data: { provider: string; providerUserId?: string; email?: string; name?: string; profile?: unknown }): Promise<DownstreamUser | null>;
  deliverMagic(data: { identifier: string; link: string; locale?: Locale }): Promise<unknown>;
  passkeysFind(query: { userId?: string; credentialId?: string }): Promise<{ userId: string; credentials: any[] } | null>;
  passkeysSave(data: { userId: string; credential: any }): Promise<unknown>;
  totpGet(query: { userId: string }): Promise<{ secret: string; enabled: boolean } | null>;
  totpSave(data: { userId: string; secret: string; enabled: boolean }): Promise<unknown>;
  preferencesGet(query: { userId: string }): Promise<UserPreferences | null>;
  preferencesSave(data: { userId: string } & UserPreferences): Promise<unknown>;
}

/**
 * Build a `DownstreamStore` from an IN-PROCESS partial implementation — implement
 * only what your enabled providers use (e.g. just `findUser` for password login).
 * Any method you didn't provide throws a clear error if ever called (fail-closed).
 *
 *   const store = defineStore({ findUser: (id) => db.users.findByEmailOrId(id) });
 *   await passwordLogin({ downstream: store, verifyPassword, signSession }, input);
 */
export function defineStore(impl: Partial<DownstreamStore>): DownstreamStore {
  const miss = (m: string) => async () => { throw new Error(`@planetlogin/core: downstream.${m}() is required by an enabled provider but not implemented`); };
  return {
    findUser: impl.findUser ?? miss('findUser'),
    upsertUser: impl.upsertUser ?? miss('upsertUser'),
    deliverMagic: impl.deliverMagic ?? miss('deliverMagic'),
    passkeysFind: impl.passkeysFind ?? miss('passkeysFind'),
    passkeysSave: impl.passkeysSave ?? miss('passkeysSave'),
    totpGet: impl.totpGet ?? miss('totpGet'),
    totpSave: impl.totpSave ?? miss('totpSave'),
    preferencesGet: impl.preferencesGet ?? miss('preferencesGet'),
    preferencesSave: impl.preferencesSave ?? miss('preferencesSave'),
  };
}

/** HTTP implementation of the contract (a separate downstream service). */
export class Downstream implements DownstreamStore {
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

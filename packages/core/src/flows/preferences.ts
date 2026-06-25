// Preferences flow (spec §4 /auth/preferences, §locale memory Tier 2). PlanetLogin
// stores nothing — these proxy the downstream, with light sanitization so a client
// can't write junk into the typed `locale`. The open `data` bag is passed through
// for the integrator to use as "that kind of info" storage.
import type { Downstream, UserPreferences } from '../downstream.ts';
import type { Locale } from '../jwt.ts';

export interface PreferencesDeps {
  downstream: Pick<Downstream, 'preferencesGet' | 'preferencesSave'>;
}

/** Keep only the known, well-typed locale fields (drop anything else). */
export function sanitizeLocale(input: unknown): Locale | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const i = input as Record<string, unknown>;
  const out: Locale = {};
  if (typeof i.language === 'string') out.language = i.language.slice(0, 16);
  if (typeof i.timezone === 'string') out.timezone = i.timezone.slice(0, 64);
  if (typeof i.country === 'string') out.country = i.country.slice(0, 2).toUpperCase();
  if (typeof i.lat === 'number' && Number.isFinite(i.lat)) out.lat = i.lat;
  if (typeof i.lon === 'number' && Number.isFinite(i.lon)) out.lon = i.lon;
  return Object.keys(out).length ? out : undefined;
}

/** Read the user's saved preferences. Always resolves (empty object if none/error). */
export async function getPreferences(deps: PreferencesDeps, input: { userId: string }): Promise<UserPreferences> {
  const p = await deps.downstream.preferencesGet({ userId: input.userId }).catch(() => null);
  return p ?? {};
}

/** Write the user's preferences. No-op when there's nothing valid to write. */
export async function savePreferences(
  deps: PreferencesDeps,
  input: { userId: string; locale?: unknown; data?: unknown },
): Promise<{ saved: boolean }> {
  const locale = sanitizeLocale(input.locale);
  const data = input.data && typeof input.data === 'object' && !Array.isArray(input.data)
    ? (input.data as Record<string, unknown>) : undefined;
  if (!locale && !data) return { saved: false };
  await deps.downstream.preferencesSave({ userId: input.userId, ...(locale ? { locale } : {}), ...(data ? { data } : {}) });
  return { saved: true };
}

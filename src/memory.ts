// Tier 0 locale memory — device-local persistence, NO backend. Pure helpers over
// a Storage-like object so they're testable and reusable: a dev with only the
// globe (no auth flavor, no server) can read/write the remembered locale directly.
// All calls are best-effort and never throw (private mode, quota, SSR → no-op).
import type { PlanetLocale } from './types';

export const DEFAULT_STORAGE_KEY = 'planetlogin:locale';

/** The minimal slice of the Web Storage API we use (localStorage/sessionStorage). */
export interface LocaleStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Read the remembered locale, or null. Validates the shape (lat/lon numbers). */
export function readSavedLocale(store: LocaleStore | null | undefined, key = DEFAULT_STORAGE_KEY): PlanetLocale | null {
  try {
    const raw = store?.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return typeof v?.lat === 'number' && typeof v?.lon === 'number' ? (v as PlanetLocale) : null;
  } catch {
    return null;
  }
}

/** Persist a locale. No-op if storage is unavailable or throws (quota/blocked). */
export function writeSavedLocale(store: LocaleStore | null | undefined, loc: PlanetLocale, key = DEFAULT_STORAGE_KEY): void {
  try {
    store?.setItem(key, JSON.stringify(loc));
  } catch {
    /* best-effort */
  }
}

/** Forget the remembered locale. */
export function clearSavedLocale(store: LocaleStore | null | undefined, key = DEFAULT_STORAGE_KEY): void {
  try {
    store?.removeItem(key);
  } catch {
    /* best-effort */
  }
}

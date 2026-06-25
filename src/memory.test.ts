// Tier 0 locale memory — pure storage helpers (no DOM). A fake Storage exercises
// round-trip, validation, key namespacing, and the never-throw guarantees.
import { describe, it, expect } from 'vitest';
import { readSavedLocale, writeSavedLocale, clearSavedLocale, DEFAULT_STORAGE_KEY, type LocaleStore } from './memory';
import type { PlanetLocale } from './types';

const fakeStore = (): LocaleStore => {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
  };
};

const loc: PlanetLocale = {
  lat: 41.39, lon: 2.16, country: 'ES', timezone: 'Europe/Madrid', language: 'es', label: 'Barcelona, Spain',
};

describe('locale memory', () => {
  it('round-trips a locale through the default key', () => {
    const s = fakeStore();
    expect(readSavedLocale(s)).toBeNull();
    writeSavedLocale(s, loc);
    expect(readSavedLocale(s)).toEqual(loc);
  });

  it('clears the remembered locale', () => {
    const s = fakeStore();
    writeSavedLocale(s, loc);
    clearSavedLocale(s);
    expect(readSavedLocale(s)).toBeNull();
  });

  it('namespaces by key', () => {
    const s = fakeStore();
    writeSavedLocale(s, loc, 'a');
    expect(readSavedLocale(s, 'b')).toBeNull();
    expect(readSavedLocale(s, 'a')).toEqual(loc);
    expect(DEFAULT_STORAGE_KEY).toBe('planetlogin:locale');
  });

  it('rejects malformed / wrong-shape stored data (no lat/lon)', () => {
    const s = fakeStore();
    s.setItem(DEFAULT_STORAGE_KEY, '{"country":"ES"}');
    expect(readSavedLocale(s)).toBeNull();
    s.setItem(DEFAULT_STORAGE_KEY, 'not json');
    expect(readSavedLocale(s)).toBeNull();
  });

  it('never throws when storage is null or throws', () => {
    expect(readSavedLocale(null)).toBeNull();
    expect(() => writeSavedLocale(null, loc)).not.toThrow();
    expect(() => clearSavedLocale(null)).not.toThrow();
    const broken: LocaleStore = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('quota'); },
      removeItem: () => { throw new Error('blocked'); },
    };
    expect(readSavedLocale(broken)).toBeNull();
    expect(() => writeSavedLocale(broken, loc)).not.toThrow();
    expect(() => clearSavedLocale(broken)).not.toThrow();
  });
});

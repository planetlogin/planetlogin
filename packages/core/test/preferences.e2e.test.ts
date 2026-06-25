// Preferences flow (Tier 2 account memory): sanitization + downstream proxy.
import { describe, it, expect } from 'vitest';
import { getPreferences, savePreferences, sanitizeLocale } from '../src/flows/preferences.ts';
import type { UserPreferences } from '../src/downstream.ts';

const fakeDownstream = (seed: UserPreferences | null = null) => {
  let saved: any = null;
  return {
    store: () => saved,
    deps: {
      downstream: {
        async preferencesGet() { return saved ?? seed; },
        async preferencesSave(data: any) { saved = data; return null; },
      },
    },
  };
};

describe('sanitizeLocale', () => {
  it('keeps only well-typed known fields, uppercases country, caps lengths', () => {
    expect(sanitizeLocale({ language: 'es', timezone: 'Europe/Madrid', country: 'es', lat: 41.4, lon: 2.1, junk: 'x' }))
      .toEqual({ language: 'es', timezone: 'Europe/Madrid', country: 'ES', lat: 41.4, lon: 2.1 });
  });
  it('drops non-finite coords and wrong types', () => {
    expect(sanitizeLocale({ lat: NaN, lon: 'nope', language: 5 })).toBeUndefined();
  });
  it('returns undefined for non-objects', () => {
    expect(sanitizeLocale(null)).toBeUndefined();
    expect(sanitizeLocale('es')).toBeUndefined();
  });
});

describe('preferences flow', () => {
  it('saves a sanitized locale + open data bag, then reads it back', async () => {
    const f = fakeDownstream();
    const r = await savePreferences(f.deps, {
      userId: 'u1',
      locale: { language: 'es', country: 'es', lat: 41.4, lon: 2.1, junk: 1 },
      data: { theme: 'dark' },
    });
    expect(r.saved).toBe(true);
    expect(f.store()).toEqual({ userId: 'u1', locale: { language: 'es', country: 'ES', lat: 41.4, lon: 2.1 }, data: { theme: 'dark' } });
    const got = await getPreferences(f.deps, { userId: 'u1' });
    expect(got.locale?.country).toBe('ES');
    expect(got.data).toEqual({ theme: 'dark' });
  });

  it('is a no-op when there is nothing valid to write', async () => {
    const f = fakeDownstream();
    const r = await savePreferences(f.deps, { userId: 'u1', locale: 'bad', data: [1, 2] as any });
    expect(r.saved).toBe(false);
    expect(f.store()).toBeNull();
  });

  it('getPreferences resolves to {} when downstream has none or errors', async () => {
    const broken = { downstream: { async preferencesGet(): Promise<any> { throw new Error('down'); }, async preferencesSave() { return null; } } };
    expect(await getPreferences(broken, { userId: 'u1' })).toEqual({});
  });
});

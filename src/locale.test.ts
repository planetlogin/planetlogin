import { describe, it, expect } from 'vitest';
import { countryToLanguage } from './locale';

describe('countryToLanguage', () => {
  it('maps known countries to their language', () => {
    expect(countryToLanguage('ES')).toBe('es');
    expect(countryToLanguage('MX')).toBe('es');
    expect(countryToLanguage('FR')).toBe('fr');
    expect(countryToLanguage('BR')).toBe('pt');
    expect(countryToLanguage('JP')).toBe('ja');
  });

  it('is case-insensitive', () => {
    expect(countryToLanguage('es')).toBe('es');
    expect(countryToLanguage('de')).toBe('de');
  });

  it('falls back to English for unknown or missing codes', () => {
    expect(countryToLanguage('ZZ')).toBe('en');
    expect(countryToLanguage('')).toBe('en');
    expect(countryToLanguage(undefined)).toBe('en');
  });
});

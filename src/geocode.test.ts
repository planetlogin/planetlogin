import { describe, it, expect } from 'vitest';
import { utcOffset } from './geocode';

describe('utcOffset', () => {
  it('returns UTC+0 around the prime meridian', () => {
    expect(utcOffset(0)).toBe('UTC+0');
    expect(utcOffset(2.17)).toBe('UTC+0'); // Barcelona longitude rounds to 0
  });

  it('signs eastern and western longitudes', () => {
    expect(utcOffset(45)).toBe('UTC+3');
    expect(utcOffset(-75)).toBe('UTC-5'); // New York-ish
    expect(utcOffset(139.7)).toBe('UTC+9'); // Tokyo-ish
  });

  it('rounds to the nearest 15° band', () => {
    expect(utcOffset(7.5)).toBe('UTC+1');
    expect(utcOffset(-7.4)).toBe('UTC+0');
  });
});

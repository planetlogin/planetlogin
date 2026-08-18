import { describe, it, expect } from 'vitest';
import { passwordStrength } from '../src/passwordStrength';

describe('passwordStrength', () => {
  it('scores 0 for empty string', () => {
    const r = passwordStrength('');
    expect(r.score).toBe(0);
    expect(r.label).toBe('very_weak');
  });

  it('scores 0 for short password', () => {
    const r = passwordStrength('abc');
    expect(r.score).toBe(0);
    expect(r.suggestions).toContain('Use at least 8 characters');
  });

  it('scores 1 for minimum-length lowercase only', () => {
    const r = passwordStrength('abcdefgh');
    expect(r.score).toBe(1);
    expect(r.label).toBe('weak');
  });

  it('scores 2 for 12+ chars with one class', () => {
    const r = passwordStrength('abcdefghijkl');
    expect(r.score).toBe(2);
    expect(r.label).toBe('fair');
  });

  it('scores 2 for 3+ classes under 12 chars', () => {
    const r = passwordStrength('Abcdefg1');
    expect(r.score).toBe(2);
    expect(r.label).toBe('fair');
  });

  it('scores 3 for all 4 classes under 12 chars', () => {
    const r = passwordStrength('Abcdef1!');
    expect(r.score).toBe(3);
    expect(r.label).toBe('strong');
  });

  it('scores 4 for 12+ chars with all 4 classes', () => {
    const r = passwordStrength('Abcdefghij1!');
    expect(r.score).toBe(4);
    expect(r.label).toBe('very_strong');
  });

  it('scores 4 for 16+ chars with 3 classes', () => {
    const r = passwordStrength('Abcdefghijklmnop1');
    expect(r.score).toBe(4);
    expect(r.label).toBe('very_strong');
  });

  it('respects custom minLength', () => {
    const r = passwordStrength('abcdef', 12);
    expect(r.score).toBe(0);
    expect(r.suggestions).toContain('Use at least 12 characters');
  });

  it('returns suggestions for missing classes', () => {
    const r = passwordStrength('abcdefgh');
    expect(r.suggestions).toEqual(expect.arrayContaining([
      expect.stringContaining('uppercase'),
      expect.stringContaining('numbers'),
      expect.stringContaining('special'),
    ]));
  });
});

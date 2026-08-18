import { describe, it, expect, vi } from 'vitest';
import { emailCheck } from '../src/flows/emailCheck';
import { defineStore } from '../src/downstream';

describe('emailCheck', () => {
  const makeDeps = (user: any) => ({
    downstream: defineStore({
      findUser: vi.fn().mockResolvedValue(user),
    }),
  });

  it('returns exists:true for existing user', async () => {
    const deps = makeDeps({ id: '1', email: 'a@b.com', passwordHash: '$2b$...' });
    const result = await emailCheck(deps, 'a@b.com', { password: { enabled: true } });
    expect(result.exists).toBe(true);
  });

  it('returns exists:false for unknown user', async () => {
    const deps = makeDeps(null);
    const result = await emailCheck(deps, 'unknown@b.com', { password: { enabled: true } });
    expect(result.exists).toBe(false);
  });

  it('throws when downstream is unavailable', async () => {
    const deps = {
      downstream: defineStore({
        findUser: vi.fn().mockRejectedValue(new Error('down')),
      }),
    };
    await expect(emailCheck(deps, 'a@b.com', { password: { enabled: true } })).rejects.toThrow('downstream_unavailable');
  });

  it('returns available methods', async () => {
    const deps = makeDeps({ id: '1', email: 'a@b.com', passwordHash: '$2b$...' });
    const result = await emailCheck(deps, 'a@b.com', {
      password: { enabled: true },
      magicLink: { enabled: true },
    });
    expect(result.exists).toBe(true);
    expect(result.methods).toEqual(expect.arrayContaining(['password', 'magic']));
  });
});

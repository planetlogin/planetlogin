import { describe, it, expect, vi } from 'vitest';
import { requestPasswordReset, verifyPasswordReset } from '../src/flows/passwordReset';
import { defineStore } from '../src/downstream';

describe('requestPasswordReset', () => {
  it('always returns accepted (no enumeration)', async () => {
    const signResetToken = vi.fn().mockResolvedValue('tok');
    const deliverReset = vi.fn().mockResolvedValue(undefined);
    const deps = {
      downstream: defineStore({ findUser: vi.fn().mockResolvedValue(null) }),
      signResetToken,
      deliverReset,
    };
    const result = await requestPasswordReset(deps, { identifier: 'x@y.com', baseUrl: 'https://app.test' });
    expect(result).toEqual({ accepted: true });
    expect(deliverReset).not.toHaveBeenCalled();
  });

  it('delivers reset link when user exists', async () => {
    const signResetToken = vi.fn().mockResolvedValue('tok');
    const deliverReset = vi.fn().mockResolvedValue(undefined);
    const deps = {
      downstream: defineStore({ findUser: vi.fn().mockResolvedValue({ id: '1', email: 'a@b.com' }) }),
      signResetToken,
      deliverReset,
    };
    await requestPasswordReset(deps, { identifier: 'a@b.com', baseUrl: 'https://app.test' });
    expect(signResetToken).toHaveBeenCalledWith('1', 'a@b.com');
    expect(deliverReset).toHaveBeenCalledWith(expect.objectContaining({
      email: 'a@b.com',
      link: expect.stringContaining('/reset?token='),
    }));
  });

  it('swallows downstream errors', async () => {
    const deps = {
      downstream: defineStore({ findUser: vi.fn().mockRejectedValue(new Error('down')) }),
      signResetToken: vi.fn(),
      deliverReset: vi.fn(),
    };
    const result = await requestPasswordReset(deps, { identifier: 'a@b.com', baseUrl: 'https://app.test' });
    expect(result).toEqual({ accepted: true });
  });
});

describe('verifyPasswordReset', () => {
  const makeStore = () => ({ claimOnce: vi.fn().mockResolvedValue(true), get: vi.fn(), set: vi.fn() });

  it('rejects invalid token', async () => {
    const result = await verifyPasswordReset(
      {
        downstream: defineStore({ findUser: vi.fn() }),
        verifyResetToken: vi.fn().mockResolvedValue(null),
        signSession: vi.fn(),
        store: makeStore(),
      },
      { token: 'bad', password: 'newpass123' },
    );
    expect(result).toEqual({ ok: false, code: 'invalid_token' });
  });

  it('rejects reused token', async () => {
    const store = makeStore();
    store.claimOnce.mockResolvedValue(false);
    const result = await verifyPasswordReset(
      {
        downstream: defineStore({ findUser: vi.fn() }),
        verifyResetToken: vi.fn().mockResolvedValue({ userId: '1', email: 'a@b.com', jti: 'j1' }),
        signSession: vi.fn(),
        store,
      },
      { token: 'tok', password: 'newpass123' },
    );
    expect(result).toEqual({ ok: false, code: 'invalid_token' });
  });

  it('updates password and signs in on success', async () => {
    const updatePassword = vi.fn().mockResolvedValue(undefined);
    const findUser = vi.fn().mockResolvedValue({ id: '1', email: 'a@b.com', name: 'Alice' });
    const signSession = vi.fn().mockResolvedValue('session-tok');
    const result = await verifyPasswordReset(
      {
        downstream: defineStore({ findUser, updatePassword }),
        verifyResetToken: vi.fn().mockResolvedValue({ userId: '1', email: 'a@b.com', jti: 'j1' }),
        signSession,
        store: makeStore(),
      },
      { token: 'tok', password: 'NewPass123!' },
    );
    expect(updatePassword).toHaveBeenCalledWith({ userId: '1', password: 'NewPass123!' });
    expect(result).toEqual({
      ok: true,
      token: 'session-tok',
      user: { id: '1', email: 'a@b.com', name: 'Alice' },
    });
  });

  it('returns downstream_unavailable when update fails', async () => {
    const result = await verifyPasswordReset(
      {
        downstream: defineStore({
          findUser: vi.fn(),
          updatePassword: vi.fn().mockRejectedValue(new Error('down')),
        }),
        verifyResetToken: vi.fn().mockResolvedValue({ userId: '1', email: 'a@b.com', jti: 'j1' }),
        signSession: vi.fn(),
        store: makeStore(),
      },
      { token: 'tok', password: 'NewPass123!' },
    );
    expect(result).toEqual({ ok: false, code: 'downstream_unavailable' });
  });
});

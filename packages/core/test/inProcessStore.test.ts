// In-process downstream: implement the §4 contract as local functions (no HTTP),
// pass it straight to the flows. Proves a SvelteKit monolith needs no REST routes.
import { describe, it, expect } from 'vitest';
import { defineStore, type DownstreamStore } from '../src/downstream.ts';
import { passwordLogin } from '../src/flows/passwordLogin.ts';
import { hashPassword, verifyPassword } from '../src/password.ts';
import { signSession, verifySession } from '../src/jwt.ts';

describe('in-process downstream (defineStore)', () => {
  it('drives password login from a local function — no HTTP', async () => {
    const passwordHash = await hashPassword('planet42');
    const db = new Map([['demo@x.com', { id: 'u1', email: 'demo@x.com', passwordHash }]]);
    const store = defineStore({
      findUser: async (id) => db.get(id) ?? null,   // ← your DB call goes here
    });

    const ok = await passwordLogin({ downstream: store, verifyPassword, signSession }, { identifier: 'demo@x.com', password: 'planet42' });
    expect(ok.ok).toBe(true);
    if (ok.ok === true) expect((await verifySession(ok.token)).sub).toBe('u1');

    const bad = await passwordLogin({ downstream: store, verifyPassword, signSession }, { identifier: 'demo@x.com', password: 'wrong' });
    expect(bad).toEqual({ ok: false, code: 'invalid_credentials' });

    const unknown = await passwordLogin({ downstream: store, verifyPassword, signSession }, { identifier: 'nobody@x.com', password: 'x' });
    expect(unknown).toEqual({ ok: false, code: 'invalid_credentials' }); // same error, no enumeration
  });

  it('a method not implemented throws a clear error (fail-closed)', async () => {
    const store = defineStore({ findUser: async () => null });
    await expect(store.preferencesGet({ userId: 'u1' })).rejects.toThrow(/preferencesGet\(\) is required/);
  });

  it('the HTTP Downstream still satisfies the same interface', async () => {
    const { Downstream } = await import('../src/downstream.ts');
    const http: DownstreamStore = new Downstream('http://x', 's'); // structural check
    expect(typeof http.findUser).toBe('function');
  });
});

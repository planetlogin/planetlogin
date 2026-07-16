// Multi-tenant conformance — BLACK-BOX. Started by run-tenants.sh with PLANETLOGIN_TENANTS
// (two hosts, each its own config + downstream) and HOST_HEADER=x-forwarded-host, so a
// request's tenant is the x-forwarded-host header. Proves one stateless process serves
// many portals: different hosts → different configs, isolated accounts, unknown → 404.
import { describe, it, expect } from 'vitest';

const BASE = (process.env.PLANETLOGIN_TEST_URL || 'http://127.0.0.1:8810').replace(/\/$/, '');
// Target a tenant by faking the proxy's forwarded host (HOST_HEADER=x-forwarded-host).
const asHost = (host: string) => ({ 'x-forwarded-host': host, 'x-forwarded-proto': 'http' });
const get = (host: string, p: string) => fetch(BASE + p, { headers: asHost(host), redirect: 'manual' });
const post = (host: string, p: string, body: unknown) =>
  fetch(BASE + p, { method: 'POST', headers: { 'content-type': 'application/json', ...asHost(host) }, body: JSON.stringify(body), redirect: 'manual' });

describe('multi-tenant: config by host', () => {
  it('each host serves its own white-label config', async () => {
    expect((await (await get('acme.test', '/auth/config')).json()).brand.name).toBe('Acme');
    expect((await (await get('beta.test', '/auth/config')).json()).brand.name).toBe('Beta');
  });
  it('an unknown host → 404 (no portal)', async () => {
    const r = await get('nobody.test', '/auth/config');
    expect(r.status).toBe(404);
    expect((await r.json()).error.code).toBe('unknown_tenant');
  });
  it('provider gates are per host (acme: password on; beta: anonymous on)', async () => {
    const a = await (await get('acme.test', '/auth/config')).json();
    const b = await (await get('beta.test', '/auth/config')).json();
    expect(a.providers.password?.enabled).toBe(true);
    expect(b.providers.anonymous?.enabled).toBe(true);
  });
});

describe('multi-tenant: account isolation', () => {
  it('the same email is a fresh account on each tenant (separate stores)', async () => {
    const email = 'shared@planetlogin.test';
    const reg = (host: string) => post(host, '/auth/password/register', { email, password: 'hunter2planet', name: host });

    expect((await reg('acme.test')).status).toBe(200); // new on acme
    expect((await reg('acme.test')).status).toBe(409); // acme's store now has it
    expect((await reg('beta.test')).status).toBe(200); // beta has NEVER seen it → isolated

    // The account created on acme logs in on acme.
    const loginA = await post('acme.test', '/auth/password/login', { identifier: email, password: 'hunter2planet' });
    expect(loginA.status).toBe(200);
  });
});

// Magic-link end to end: a real signed token is issued, "delivered" to the mock,
// extracted from the link, verified, and mints a verifiable session — with no
// account enumeration and no storage on PlanetLogin's side.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'node:http';
import { AddressInfo } from 'node:net';
import { createMockDownstream, type Delivery } from '../mock-downstream/server.ts';
import { Downstream } from '../src/index.ts';
import { signMagicToken, verifyMagicToken, signSession, verifySession } from '../src/index.ts';
import { requestMagicLink, verifyMagicLink } from '../src/index.ts';
import { _stores } from '../src/index.ts';

const none = () => new _stores.NoneStore();

let server: Server;
let baseUrl: string;
const deliveries: Delivery[] = [];

beforeAll(async () => {
  server = createMockDownstream(
    [{ id: 'u-demo', email: 'demo@acme.com', name: 'Demo' }],
    deliveries,
  );
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server?.close());

const ds = () => new Downstream(baseUrl, 'test-secret');

describe('magic link — end to end', () => {
  it('delivers a link to a real account, then verifies it into a session', async () => {
    deliveries.length = 0;
    const res = await requestMagicLink(
      { downstream: ds(), signMagicToken },
      { identifier: 'demo@acme.com', baseUrl: 'https://login.acme.com' },
    );
    expect(res).toEqual({ accepted: true });
    expect(deliveries).toHaveLength(1);

    const token = new URL(deliveries[0].link).searchParams.get('token')!;
    expect(token).toBeTruthy();

    const v = await verifyMagicLink({ downstream: ds(), verifyMagicToken, signSession, store: none() }, { token });
    expect(v.ok).toBe(true);
    if (!v.ok) return;
    const claims = await verifySession(v.token);
    expect(claims.sub).toBe('u-demo');
  });

  it('does not enumerate: unknown account → accepted, but nothing delivered', async () => {
    deliveries.length = 0;
    const res = await requestMagicLink(
      { downstream: ds(), signMagicToken },
      { identifier: 'nobody@acme.com', baseUrl: 'https://login.acme.com' },
    );
    expect(res).toEqual({ accepted: true });
    expect(deliveries).toHaveLength(0);
  });

  it('rejects a tampered token', async () => {
    const good = await signMagicToken('demo@acme.com');
    const v = await verifyMagicLink(
      { downstream: ds(), verifyMagicToken, signSession, store: none() },
      { token: good.slice(0, -3) + 'zzz' },
    );
    expect(v).toEqual({ ok: false, code: 'invalid_token' });
  });

  it('a magic token cannot be replayed as a session token', async () => {
    const magic = await signMagicToken('demo@acme.com');
    // wrong audience → session verification must fail
    await expect(verifySession(magic)).rejects.toBeTruthy();
  });
});

describe('single-use (pluggable store)', () => {
  it('with a store ON, a magic link works exactly once', async () => {
    const store = new _stores.MemoryStore();
    const token = await signMagicToken('demo@acme.com');
    const first = await verifyMagicLink({ downstream: ds(), verifyMagicToken, signSession, store }, { token });
    expect(first.ok).toBe(true);
    const second = await verifyMagicLink({ downstream: ds(), verifyMagicToken, signSession, store }, { token });
    expect(second).toEqual({ ok: false, code: 'invalid_token' }); // already used
  });

  it('with store=none (default), it degrades to TTL (reusable within TTL)', async () => {
    const token = await signMagicToken('demo@acme.com');
    const a = await verifyMagicLink({ downstream: ds(), verifyMagicToken, signSession, store: none() }, { token });
    const b = await verifyMagicLink({ downstream: ds(), verifyMagicToken, signSession, store: none() }, { token });
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true); // stateless: no single-use guarantee
  });
});

# PlanetLogin — Conformance suite

Black-box tests that validate a **running flavor** against the [SPEC](../SPEC.md)
by its HTTP API only. A flavor is *conformant* when it passes this suite — that is
what makes "the same app in N frameworks" verifiable, not a claim.

## Run against any flavor

```bash
./run.sh <command that starts the flavor server>
# e.g.
./run.sh node ../flavors/svelte/build/index.js
```

`run.sh` starts the reference downstream (`mock-downstream.mjs`, seeds
`demo@planetlogin.test` / `planet42`, stores preferences, and captures magic links),
starts your flavor pointed at it with every contract flow enabled, waits for
`/auth/config`, and runs the suite. CI runs this per flavor and publishes the matrix.

## What it checks (spec §3) — 17 checks
- **config & keys** — `/auth/config` returns `spec:1` + brand + providers; **never
  leaks secret values**; JWKS serves a key set.
- **password login** — correct → JWT verifiable via JWKS + session cookie; wrong →
  401; unknown → the *same* 401 (no enumeration); missing fields → 400.
- **session** — validates a real token; rejects when absent; **rejects tampered /
  garbage tokens**; `/auth/logout` → 200 and clears the cookie.
- **anonymous** — `/auth/anonymous` mints a signed guest token (`anon:true`, no
  account/backend) carrying the picked locale.
- **magic link** — full round-trip: request → 202 → the delivered link verifies to a
  session → **the link is single-use** (second use → 401); unknown id still → 202.
- **preferences** — session-gated (401 without a token); saves/reads locale + data;
  **partial saves are independent** (saving `data` keeps `locale`).
- **oauth start** — enabled provider → 302 to the provider with PKCE + state cookie;
  disabled provider → 403 `not_enabled`.
- **error shape** — a stable `{error:{code,message}}` throughout.

Every response body error uses the stable `{error:{code,message}}` shape.

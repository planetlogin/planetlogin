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

`run.sh` starts the reference downstream (`mock-downstream.mjs` — seeds
`demo@planetlogin.test` / `planet42`, stores preferences/TOTP/passkeys, captures magic
links) **and** a mock OAuth provider (`mock-oauth.mjs`), starts your flavor with every
contract flow enabled, waits for `/auth/config`, and runs the suite. CI runs this per
flavor and publishes the matrix.

## What it checks (spec §3) — 23 checks
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
- **TOTP 2FA** — enroll → confirm with a real code → password login **hands off to the
  second factor** (`pl_mfa`) → verify → session; a wrong code → 401. (Codes are
  generated with `otpauth`.)
- **passkeys / WebAuthn** — a **virtual ES256 authenticator** (`mock-authenticator.mjs`)
  registers a credential, then authenticates usernameless → session; a garbage
  assertion → 401. Verified by the flavor's real `@simplewebauthn` server.
- **oauth** — enabled provider → 302 with PKCE + state cookie; disabled → 403; **full
  callback round-trip** against the mock provider (code → token → profile → upsert →
  session); a mismatched state → 400 (CSRF).
- **error shape** — a stable `{error:{code,message}}` throughout.

## Bench

`../bench/` runs the same black-box load over a flavor and reports req/s + p50/p95/p99
per endpoint — the performance leaderboard, comparable across flavors.

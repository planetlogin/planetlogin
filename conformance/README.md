# PlanetLogin — Conformance suite

Black-box tests that validate a **running flavor** against the [SPEC](../SPEC.md)
by its HTTP API only. A flavor is *conformant* when it passes this suite — that is
what makes "the same app in N frameworks" verifiable, not a claim.

## Run against any flavor

```bash
./run.sh <command that starts the flavor server>
# e.g.
./run.sh node ../../flavors/svelte/build/index.js
```

`run.sh` starts the reference downstream (`mock-downstream.mjs`, seeds
`demo@planetlogin.test` / `planet42`), starts your flavor pointed at it, waits for
`/auth/config`, and runs the suite. CI runs this per flavor and publishes the matrix.

## What it checks (spec §3)
`/auth/config`, JWKS, password login (correct → JWT verifiable via JWKS + cookie;
wrong → 401; unknown → same 401, no enumeration; missing → 400), `/auth/session`,
magic 202, and the stable `{error:{code,message}}` shape.

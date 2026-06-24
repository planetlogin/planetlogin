# planetlogin-vanilla

A **flavor** of PlanetLogin with **no framework** — a plain Node `http()` server
(`server.ts`) that consumes [`@planetlogin/core`](../planetlogin-core) and adds only
the HTTP binding. The auth logic lives in the core; this flavor is the thin layer
that maps it to routes.

```bash
npm install
PLANETLOGIN_CONFIG='{"spec":1,...}' PLANETLOGIN_DOWNSTREAM_URL=... npm start
```

Passes the hub's conformance suite (9/9, incl. login JWT verified via JWKS) — the
same suite every flavor must pass.

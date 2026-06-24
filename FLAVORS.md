# PlanetLogin — Flavors

The *same* auth portal, implemented per runtime/framework. The [SPEC](SPEC.md) is the
constant; a flavor is **conformant** when it passes the [conformance suite](conformance/)
(and it shows up on the [bench](bench/)). The axis is the runtime, not taste — the HTTP
binding changes per framework, the auth logic does not.

| Flavor | Runtime / framework | Auth methods | Conformance | Notes |
|---|---|---|---|---|
| **svelte** (reference) | SvelteKit (Node) | password · magic · OAuth/OIDC · passkeys · TOTP | green (8/8) | full front + back, 31 unit/e2e tests, benched |
| **vanilla** | plain Node `http()` | password · magic · TOTP | green (9/9) | proves a non-framework flavor passes the same suite |

Planned: react/next, vue/nuxt, and native (Kotlin Multiplatform, Flutter) sharing one
view-model contract.

## Add a flavor
1. Implement the [SPEC](SPEC.md) §3 endpoints over the [§4 downstream contract](SPEC.md).
2. `conformance/run.sh <start-cmd>` until green.
3. `bench/run.sh <start-cmd>` for the leaderboard.
4. Open a PR adding a row above.

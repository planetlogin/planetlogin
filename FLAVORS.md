# PlanetLogin — Flavors

The auth logic lives **once**, in [`@planetlogin/core`](https://github.com/planetlogin/planetlogin)
(framework-agnostic: flows, JWT/JWKS, all-terrain password verify, the downstream
contract, the pluggable store — and the test suite). A **flavor** adds only its
runtime's HTTP binding (and, for web, a front). The [SPEC](SPEC.md) is the constant;
a flavor is **conformant** when it passes the [conformance suite](conformance/) (and it
shows up on the [bench](bench/)). The axis is the runtime, not taste.

| Flavor | Runtime / framework | Over the core | Conformance |
|---|---|---|---|
| **svelte** | SvelteKit (Node) | routes + globe login front (password · magic · OAuth · passkeys · TOTP) | build green |
| **vanilla** | plain Node `http()` | a thin `http()` binding | green (9/9) |

`@planetlogin/core` itself: **31 tests green**, typecheck clean. Both flavors consume
it as a dependency — neither owns the logic.

Planned: react/next, vue/nuxt, and native (Kotlin Multiplatform, Flutter) sharing one
view-model contract.

## Add a flavor
1. Depend on `@planetlogin/core`; bind its flows to your runtime's HTTP layer (spec §3
   endpoints over the §4 downstream contract).
2. `conformance/run.sh <start-cmd>` until green.
3. `bench/run.sh <start-cmd>` for the leaderboard.
4. Open a PR adding a row above.

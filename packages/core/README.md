# @planetlogin/core

The framework-agnostic **auth core** of PlanetLogin: the flows (password, magic link,
OAuth/OIDC, passkeys, TOTP), JWT/JWKS, all-terrain password verification, the
downstream contract client, and the pluggable session store.

No HTTP, no framework. Each **flavor** adds only its runtime's HTTP binding and calls
into this package — so the auth logic lives once and every flavor stays in lockstep
with the [SPEC](../../SPEC.md). It also owns the **unit/e2e test suite** — the logic is
validated here, not in any flavor. Verified: the vanilla flavor consumes this and passes
the black-box [conformance suite](../../conformance); the SvelteKit flavor builds green over it.

```ts
import { passwordLogin, signSession, verifyPassword, downstreamFromEnv } from '@planetlogin/core';
```

Pure dependencies only (jose, hash-wasm, bcryptjs, @simplewebauthn/server, otpauth) —
no crypto is hand-rolled. Runs under tsx today; ships as compiled JS for publishing.

## Build

```bash
npm run build   # tsup → dist/index.js (ESM) + dist/index.d.ts
npm test        # 31 tests   ·   npm run typecheck
```

Flavors consume the built `dist/` (the `exports`/`types`/`main` all point there), so
they never transpile core source. `prepublishOnly` rebuilds before npm publish.

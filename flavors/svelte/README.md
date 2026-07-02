# planetlogin-svelte

The **SvelteKit flavor** of [PlanetLogin](https://github.com/planetlogin/planetlogin)
— a stateless auth portal (no database **of its own** — persistence is your store,
downstream over REST; or none at all for guest sessions — asymmetric JWT, white-label).
It consumes [`@planetlogin/core`](../../packages/core) and adds the
SvelteKit HTTP routes plus the globe login front. **Svelte is just a flavor**; the auth
logic and its tests live in the core.

## What it provides
- A config-driven login UX (the d3-geo globe + i18n) that renders whatever the
  `/auth/config` enables: password, magic link, OAuth buttons, passkey, 2FA step.
- The spec §3 endpoints as SvelteKit `+server.ts` routes, each a thin wrapper over a
  core flow: password (multi-format) · magic link · OAuth/OIDC · passkeys · TOTP.

```bash
npm install   # links @planetlogin/core (file: dep)
npm run dev    # or: npm run build && node build
```

Build is green; the auth-logic test suite (31) lives in `@planetlogin/core`.

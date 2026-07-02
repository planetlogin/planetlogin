# PlanetLogin — Whitepaper

> A professional, white-label **login portal** you drop in front of any app —
> stateless, no database, integrates over REST, and greets every visitor in
> their own language from a spinning globe.

**Status:** vision / v1 design. This document is the root of the project — the
*spec*, the *conformance suite*, the *benchmark harness* and every framework
*flavor* derive from it.

---

## 1. What PlanetLogin is

PlanetLogin is an **authentication intermediary**: a self-contained microservice
(front + back) that renders the *welcome / sign-in experience* and orchestrates
the standard auth flows — **without ever storing anything itself**. It does not
own users, passwords or sessions. It is the **portal**, not the vault.

- **It does:** render the login UI (the signature globe + the forms), run the
  flows (email/password, OAuth/OIDC, magic link, passkeys; SAML later), apply the
  white-label config, detect locale, and hand the result to you.
- **It does not:** keep a database. Persistence and the user store are **yours**
  — PlanetLogin talks to them **downstream over REST**. Bring your own storage.

Think of it as **"Universal Login" you own** — the hosted sign-in screen pattern
(à la Auth0), but stateless, self-hostable, brandable, and reusable across every
project you build.

## 2. Why

1. **Stop rewriting auth per app.** Every project re-implements the same login.
   PlanetLogin is the reusable, well-thought one you drop in everywhere.
2. **Don't depend on Auth0/Clerk/Supabase.** Own the portal; pay no per-MAU rent;
   no vendor lock-in.
3. **Built for a global audience.** The globe isn't decoration — it detects
   timezone, language and location, so the portal localizes from the first second.
4. **Sellable to non-technical buyers.** A visual white-label studio
   (`demo_admin.html`) lets an admin brand and preview the portal without code.

## 3. Principles (non-negotiable)

- **Never reinvent crypto.** PlanetLogin composes *audited, standard primitives*
  — it does not invent algorithms. (See §6.)
- **Stateless, zero storage.** No database in PlanetLogin. All persistence is
  downstream, reached over REST. The service can be killed and restarted with no
  data loss because it holds no data.
- **REST-first integration.** Everything PlanetLogin exposes and consumes is a
  documented REST contract. Easy to wire into anything.
- **White-label by config.** One config schema drives branding, providers and
  copy — loaded from env vars (self-host) or the admin studio (non-technical).
- **Accessible & global by default.** Keyboard-operable, ARIA, reduced-motion,
  i18n. A login the whole world can use.

## 4. Architecture

```
        ┌─────────────────────────── PlanetLogin (a "flavor") ───────────────────────────┐
 user ──►  FRONT  (globe + forms, white-labeled, i18n)                                     │
        │     │  calls                                                                     │
        │     ▼                                                                            │
        │  BACK / BFF  — orchestrates flows with audited primitives, holds NO state        │
        │     │  REST (downstream contract)                                                │
        └─────┼────────────────────────────────────────────────────────────────────────┘
              ▼
        YOUR STORE / IdP  (your users API, an OAuth provider, an enterprise SAML IdP…)
              — persistence + identity live here, owned by the integrator
```

- **Front:** the login portal (the `<planet-login>` globe is the hero). Fully
  white-labeled and localized.
- **Back (BFF):** runs the flows (token issue/verify, OAuth client, WebAuthn
  ceremonies, SAML SP) using standard libraries. Stateless: relay-state and
  short-lived flow state only, never user data.
- **Downstream:** the integrator's REST endpoints PlanetLogin calls to verify a
  credential, fetch a user, or persist a session. PlanetLogin defines the
  *contract*; you implement it however you store data.
- **Out:** PlanetLogin returns a clean session / signed token (JWT, asymmetric so
  your services verify with a public key via JWKS).

## 5. Auth methods

| Method | Tier | Notes |
|---|---|---|
| Email + password | v1 | Argon2id verification; storage downstream |
| OAuth / OIDC social (Google, GitHub, Apple…) | v1 | PlanetLogin is the client |
| Magic link | v1 | Token issue/verify; delivery downstream |
| Passkeys / WebAuthn | v1 | Passwordless, modern |
| TOTP 2FA | v1 | Standard authenticator apps |
| **SAML** (enterprise SSO) | later / enterprise | XML-based. PlanetLogin acts as **SP**, via an audited SAML library — **never hand-rolled** (XML-signature is a security minefield). Declared in the spec as an *optional* provider; not required of every flavor. |

## 6. The crypto — standard, audited, zero-storage

Because PlanetLogin stores nothing, the right tools are **DB-agnostic primitive
libraries**, not full auth frameworks (Better Auth, Lucia, Keycloak) which assume
a database. Reference primitives:

- **Password hashing:** Argon2id (`@node-rs/argon2`).
- **Tokens:** `jose` — JWS/JWE, **asymmetric** (EdDSA / RS256) so downstream
  services verify with the public key (JWKS). Key rotation built in.
- **OAuth2 / OIDC / WebAuthn / OTP primitives:** Oslo (`@oslojs/*`) — audited,
  storage-free building blocks.
- **SAML (later):** a maintained SAML SP library.
- **Transport:** TLS everywhere.

PlanetLogin *composes* these. It writes no cryptography of its own.

## 7. White-label & the admin studio

A single **config schema** (branding, providers, copy/i18n, layout) drives the
portal. It is loaded two ways from the **same** schema — never two sources of truth:

- **Self-host (developers):** environment variables.
- **Non-technical (`demo_admin.html`):** a visual studio — toggle providers, set
  logo / colors / brand name / copy, see the portal update **live**, then export
  to `.env` / JSON. The wedge toward a future **hosted mode** (configure in the
  studio → get a hosted login URL / embed snippet, no servers touched).

## 8. The "flavors" model

PlanetLogin is delivered as **flavors**: *the same application, faithfully
re-implemented per framework / runtime* — `planetlogin-svelte`, `planetlogin-react`,
`planetlogin-vue`, `planetlogin-vanilla`, `planetlogin-kotlin`, `planetlogin-flutter`…
This is the **RealWorld / Conduit** pattern applied to a login portal.

Why flavors (not one core + wrappers):
- **Performance:** faithful re-implementations make a *fair benchmark* across
  frameworks — a real goal of the project.
- **Community:** each flavor has its own maintainers; contributors improve their
  stack's flavor without touching the others.
- **Pick your stack:** integrators take the flavor that matches their project.

What keeps "the same app ×N" honest — **not good faith, but verification:**

- **The spec** (this repo): the normative REST contract (OpenAPI), env vars,
  config schema, and behavior. Every flavor obeys it.
- **The conformance suite:** end-to-end tests every flavor must pass. Green = it
  really is *the same PlanetLogin*.
- **The benchmark harness:** the same scenario run against each flavor → comparable
  numbers.

> Web frameworks (Svelte/React/Vue/vanilla/TS) share one runtime; a flavor may be
> as thin as binding the shared UI. Native (Kotlin/Flutter) is a genuine
> re-implementation — Kotlin Multiplatform can share the view-model where wanted.

## 9. Project structure

```
planetlogin/                 ← ROOT = the canonical definition (this repo, an npm workspace)
├─ WHITEPAPER.md             ← this document (the why + the what)
├─ SPEC.md / openapi.yaml / config.schema.json / ENV.md   ← the exact contract
├─ conformance/              ← e2e suite every flavor must pass
├─ bench/                    ← performance harness
├─ packages/core/            ← @planetlogin/core: the framework-agnostic auth logic (published to npm)
└─ flavors/                  ← thin HTTP bindings over the core, one per runtime
   ├─ svelte/                ← SvelteKit flavor + globe login front
   ├─ vanilla/               ← plain Node http() flavor
   └─ react / vue / kotlin / flutter …   ← planned
```

The flavors are **not** the project — they implement it. The project *is* the
whitepaper + spec + conformance + benchmark.

## 10. Roadmap

- **v1:** spec + reference flavor (Svelte) + the web flavors (vanilla/react/vue),
  conformance suite, white-label config + `demo_admin.html`, OAuth/OIDC + email +
  passkeys, downstream REST contract.
- **Later:** SAML (enterprise), native flavors (Kotlin/Flutter), hosted mode
  (SaaS for non-technical buyers), the benchmark leaderboard.

## 11. License & attribution

Open source under **AGPL-3.0 + attribution** (the visible `PlanetLogin · by Ricajos`
credit). Free for any use, including commercial. A commercial / white-label license
(no copyleft, no credit) is available — open an issue.

---

*PlanetLogin is a personal-dream project by **Ricard** ([Ricajos](https://ricajos.com))
— the login screen always wanted, built to be reused everywhere.*

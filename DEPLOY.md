# Deploy your own PlanetLogin portal

From zero to a running, branded login portal at `https://login.your.app` — using the
prebuilt image, no cloning or building. PlanetLogin is **stateless** (no database of
its own), so this is one container + your config + your keys.

> Design it visually first: the **[white-label studio](https://planetlogin.org/demo_admin.html)**
> exports the `config.json`, `.env` and `docker-compose.yml` used below.

## 1. What you need

- **Docker** on any host (amd64 or arm64 — the image ships both).
- **A downstream** — where accounts live (spec [§4](SPEC.md)). Either your app
  exposing the REST contract, or start with the zero-deps
  [reference downstream](examples/downstream) / the batteries stores
  ([`store-sqlite`](packages/store-sqlite), [`store-postgres`](packages/store-postgres)).
  Anonymous-only portals need none at all.
- **A signing key** (one command, below).

## 2. Files

Put these three files in a directory — the studio's **Deploy** tab generates the
compose and config for you:

**`planetlogin.config.json`** — your white-label config (studio → `config.json` tab).

**`pl.pem`** — the JWT signing key:

```bash
npx planetlogin-keygen pl.pem     # EdDSA private key (keep it out of git)
```

**`docker-compose.yml`**:

```yaml
services:
  planetlogin:
    image: ghcr.io/planetlogin/portal:latest
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"          # your reverse proxy terminates TLS
    environment:
      - PLANETLOGIN_BASE_URL=https://login.your.app
      - PLANETLOGIN_APP_ORIGIN=https://your.app          # where to return after login
      - PLANETLOGIN_COOKIE_DOMAIN=.your.app              # share the session cross-subdomain
      - PLANETLOGIN_CONFIG=/app/planetlogin.config.json
      - PLANETLOGIN_JWT_PRIVATE_KEY=/run/secrets/pl.pem
      - PLANETLOGIN_JWT_KID=your-app-2026a               # stable key id (rotation-friendly)
      - PLANETLOGIN_DOWNSTREAM_URL=https://api.your.app/identity
      - PLANETLOGIN_DOWNSTREAM_SECRET=${PLANETLOGIN_DOWNSTREAM_SECRET}
      - PLANETLOGIN_SESSION_STORE=memory                 # enables rate limiting + single-use links
      - PLANETLOGIN_TRUST_PROXY=true                     # behind Traefik/nginx/Caddy
    volumes:
      - ./planetlogin.config.json:/app/planetlogin.config.json:ro
      - ./pl.pem:/run/secrets/pl.pem:ro
```

## 3. Run

```bash
export PLANETLOGIN_DOWNSTREAM_SECRET=$(openssl rand -hex 32)   # also give it to your downstream
docker compose up -d
curl -s localhost:3000/auth/config | head -c 200               # alive?
```

Point your reverse proxy at `127.0.0.1:3000` for `login.your.app`, and you're live.
Your app verifies sessions **offline** via the JWKS at
`https://login.your.app/auth/.well-known/jwks.json` — no shared secret
(see [INTEGRATION.md](INTEGRATION.md)).

## 4. Checklist before real traffic

- [ ] `pl.pem` mounted (without it the portal warns and uses an **ephemeral** key —
      every restart logs everyone out).
- [ ] `PLANETLOGIN_JWT_KID` set to a stable value.
- [ ] `PLANETLOGIN_SESSION_STORE` **not** `none` — otherwise login/magic/TOTP have
      no brute-force protection (memory = single instance; redis when scaled).
- [ ] `PLANETLOGIN_TRUST_PROXY=true` only when actually behind a proxy.
- [ ] CORS: `PLANETLOGIN_CORS_ORIGINS=https://your.app` if the app calls the portal
      cross-origin.
- [ ] The downstream secret is shared with — and required by — your downstream.

## Multi-tenant (one deployment, many portals)

The portal is stateless, so one container can serve many hosts — each its own brand
and its own account store. Set `PLANETLOGIN_TENANTS` (inline JSON or a file) instead
of `PLANETLOGIN_CONFIG`:

```json
{
  "acme.login.example": { "config": { "spec": 1, "brand": { "name": "Acme" }, "providers": { "password": { "enabled": true } } },
    "downstream": { "url": "https://api.acme.example/identity", "secret": "…" } },
  "beta.login.example": { "config": { "spec": 1, "brand": { "name": "Beta" }, "providers": { "anonymous": { "enabled": true } } },
    "downstream": { "url": "https://api.beta.example/identity", "secret": "…" } }
}
```

Behind a reverse proxy, forward the host and tell the portal to trust it:
`HOST_HEADER=x-forwarded-host` and `PROTOCOL_HEADER=x-forwarded-proto`. Unknown hosts
get a 404. For a dynamic tenant list (a DB, not a static file), register your own
resolver with `provideTenants()` from `@planetlogin/core` and build a thin custom image.

## Variants

- **Path-mount** (`your.app/auth` instead of a subdomain): the mount point is baked
  at build time — `docker build --build-arg PLANETLOGIN_BASE=/auth flavors/svelte`.
- **Pin a version**: `ghcr.io/planetlogin/portal:<x.y.z>` (published from `portal-v*`
  tags); `latest` tracks `main`.
- **Swarm**: same image; see the pattern in any `docker service` setup — the portal
  is stateless, scale replicas freely (use a shared `redis` store when you do).

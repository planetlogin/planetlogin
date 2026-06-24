# Reference downstream (spec §4)

Your side of the PlanetLogin contract: the identity/persistence store. The portal is
stateless and calls these REST endpoints. This example is **real and persistent**
(pure Node + `node:sqlite`, zero deps) so you can run the whole loop locally and then
adapt it — keep the route shapes, swap `node:sqlite` for your store (Postgres, Prisma,
Drizzle, your existing user table).

```bash
PLANETLOGIN_DOWNSTREAM_SECRET=s3cret npm start      # → http://127.0.0.1:8799
```
Then point the portal at it:
```bash
PLANETLOGIN_DOWNSTREAM_URL=http://127.0.0.1:8799 PLANETLOGIN_DOWNSTREAM_SECRET=s3cret <run a flavor>
```

## Endpoints → core's `Downstream` client (1:1)
| Route | Called by | You must |
|---|---|---|
| `POST /users/find` | password / magic / session | return the user (incl. `passwordHash`, `totpEnabled`) or 404 |
| `POST /users/upsert` | OAuth callback | create/update by email → return the user |
| `POST /magic/deliver` | magic request | email/SMS the link (here: logged) → 202 |
| `POST /passkeys/find` `/passkeys/save` | passkeys | store/return WebAuthn credentials |
| `POST /totp/find` `/totp/save` | 2FA | store/return the TOTP secret + enabled flag |

Every call carries `Authorization: Bearer $PLANETLOGIN_DOWNSTREAM_SECRET` — reject anything else.

## Note on password users
PlanetLogin **verifies** passwords (all-terrain over your stored hash) but does not
create password accounts — your app's signup does (write the row with any hash format
argon2id/bcrypt/scrypt/pbkdf2). The seed here inserts one so the demo works. OAuth,
passkeys and TOTP accounts *are* created/updated through the contract above.

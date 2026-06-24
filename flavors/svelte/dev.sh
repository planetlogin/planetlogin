#!/usr/bin/env bash
# One-command dev: seeds a demo user, starts the mock downstream, runs the app.
# Then open the dev URL and sign in with  demo@acme.com / planet42
set -e
cd "$(dirname "$0")"
HASH=$(npx tsx -e "import('./src/lib/server/password.ts').then(async m=>process.stdout.write(await m.hashPassword('planet42')))")
DEMO_HASH="$HASH" npx tsx mock-downstream/server.ts & MOCK=$!
trap "kill $MOCK 2>/dev/null" EXIT
export PLANETLOGIN_CONFIG='./planetlogin.config.json'
export PLANETLOGIN_DOWNSTREAM_URL='http://127.0.0.1:8788'
export PLANETLOGIN_DOWNSTREAM_SECRET='test-secret'
echo "▶ demo user: demo@acme.com / planet42"
npm run dev

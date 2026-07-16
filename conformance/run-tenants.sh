#!/usr/bin/env bash
# Multi-tenant conformance: one stateless flavor process serving two hosts, each with
# its own config AND its own downstream (account isolation).
#   ./run-tenants.sh node ../flavors/svelte/build/index.js
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || npm install --silent >/dev/null 2>&1

# Two independent downstreams — proves tenants don't share accounts.
MOCK_PORT=8799 node mock-downstream.mjs & MOCK_A=$!
MOCK_PORT=8797 node mock-downstream.mjs & MOCK_B=$!
FLAVOR_PORT=8810

# host → { config, downstream }. acme = password; beta = password + anonymous.
export PLANETLOGIN_TENANTS='{
  "acme.test": { "config": {"spec":1,"brand":{"name":"Acme"},"providers":{"password":{"enabled":true,"allowRegister":true}}}, "downstream": {"url":"http://127.0.0.1:8799","secret":"test-secret"} },
  "beta.test": { "config": {"spec":1,"brand":{"name":"Beta"},"providers":{"password":{"enabled":true,"allowRegister":true},"anonymous":{"enabled":true}}}, "downstream": {"url":"http://127.0.0.1:8797","secret":"test-secret"} }
}'
# Derive the request host from x-forwarded-host so the suite can target a tenant.
export PROTOCOL_HEADER=x-forwarded-proto
export HOST_HEADER=x-forwarded-host
export PORT="$FLAVOR_PORT"
export PLANETLOGIN_SESSION_STORE=memory
export PLANETLOGIN_RATELIMIT_LOGIN_LIMIT=100000
"$@" & FLAVOR=$!
trap "kill $MOCK_A $MOCK_B $FLAVOR 2>/dev/null" EXIT

for i in $(seq 1 40); do
  curl -sf -H "x-forwarded-host: acme.test" -H "x-forwarded-proto: http" "http://127.0.0.1:${FLAVOR_PORT}/auth/config" >/dev/null 2>&1 && break
  sleep 0.5
done
PLANETLOGIN_TEST_URL="http://127.0.0.1:${FLAVOR_PORT}" npx vitest run --config vitest.tenants.config.ts

#!/usr/bin/env bash
# Run the conformance suite against ANY flavor.
#   ./run.sh <command to start the flavor's server...>
# e.g. ./run.sh node ../../flavors/svelte/build/index.js
# We start the reference mock downstream + the flavor (pointed at it) + the suite.
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || npm install --silent >/dev/null 2>&1

MOCK_PORT=8799 node mock-downstream.mjs & MOCK=$!
FLAVOR_PORT=8810
# Enable every contract flow the suite exercises: password, magic link, anonymous,
# OAuth (google), and account-bound preferences (locale.persist).
export PLANETLOGIN_CONFIG='{"spec":1,"brand":{"name":"Conformance"},"providers":{"password":{"enabled":true},"magicLink":{"enabled":true},"anonymous":{"enabled":true},"oauth":[{"id":"google"}]},"locale":{"persist":true}}'
export PLANETLOGIN_DOWNSTREAM_URL="http://127.0.0.1:8799"
export PLANETLOGIN_DOWNSTREAM_SECRET="test-secret"
export PLANETLOGIN_BASE_URL="http://127.0.0.1:${FLAVOR_PORT}"
export PORT="$FLAVOR_PORT"
# OAuth client so /auth/oauth/google/start can build the redirect (no real calls made).
export PLANETLOGIN_OAUTH_GOOGLE_CLIENT_ID="conformance-client"
export PLANETLOGIN_OAUTH_GOOGLE_CLIENT_SECRET="conformance-secret"
# A shared store enables single-use magic links; raise rate limits so the suite's
# request volume never trips throttling (rate limiting itself isn't a contract check).
export PLANETLOGIN_SESSION_STORE="memory"
export PLANETLOGIN_RATELIMIT_LOGIN_LIMIT="100000"
export PLANETLOGIN_RATELIMIT_MAGIC_LIMIT="100000"
export PLANETLOGIN_RATELIMIT_ANON_LIMIT="100000"
export PLANETLOGIN_RATELIMIT_TOTP_LIMIT="100000"
"$@" & FLAVOR=$!
trap "kill $MOCK $FLAVOR 2>/dev/null" EXIT

# wait for the flavor to be ready
for i in $(seq 1 40); do
  curl -sf "http://127.0.0.1:${FLAVOR_PORT}/auth/config" >/dev/null 2>&1 && break
  sleep 0.5
done
PLANETLOGIN_TEST_URL="http://127.0.0.1:${FLAVOR_PORT}" npx vitest run

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
export PLANETLOGIN_CONFIG='{"spec":1,"brand":{"name":"Conformance"},"providers":{"password":{"enabled":true},"magicLink":{"enabled":true}}}'
export PLANETLOGIN_DOWNSTREAM_URL="http://127.0.0.1:8799"
export PLANETLOGIN_DOWNSTREAM_SECRET="test-secret"
export PLANETLOGIN_BASE_URL="http://127.0.0.1:${FLAVOR_PORT}"
export PORT="$FLAVOR_PORT"
"$@" & FLAVOR=$!
trap "kill $MOCK $FLAVOR 2>/dev/null" EXIT

# wait for the flavor to be ready
for i in $(seq 1 40); do
  curl -sf "http://127.0.0.1:${FLAVOR_PORT}/auth/config" >/dev/null 2>&1 && break
  sleep 0.5
done
PLANETLOGIN_TEST_URL="http://127.0.0.1:${FLAVOR_PORT}" npx vitest run

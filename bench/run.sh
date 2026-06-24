#!/usr/bin/env bash
# Bench any flavor:  ./run.sh <command to start the flavor server...>
set -e
cd "$(dirname "$0")"
MOCK_PORT=8799 node ../conformance/mock-downstream.mjs & MOCK=$!
FLAVOR_PORT=8810
export PLANETLOGIN_CONFIG='{"spec":1,"brand":{"name":"Bench"},"providers":{"password":{"enabled":true}}}'
export PLANETLOGIN_DOWNSTREAM_URL="http://127.0.0.1:8799"
export PLANETLOGIN_DOWNSTREAM_SECRET="test-secret"
export PLANETLOGIN_BASE_URL="http://127.0.0.1:${FLAVOR_PORT}" PORT="$FLAVOR_PORT"
"$@" & FLAVOR=$!
trap "kill $MOCK $FLAVOR 2>/dev/null" EXIT
for i in $(seq 1 40); do curl -sf "http://127.0.0.1:${FLAVOR_PORT}/auth/config" >/dev/null 2>&1 && break; sleep 0.5; done
PLANETLOGIN_TEST_URL="http://127.0.0.1:${FLAVOR_PORT}" node bench.mjs

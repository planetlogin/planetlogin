#!/usr/bin/env bash
set -euo pipefail

# PlanetLogin deploy: tar+ssh + docker build + swarm update
# Runs from Windows or any machine with SSH to the VPS.
# Usage: ./deploy.sh [tag]  (default: auto-increment from current)

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO"

# Where to deploy. None of it lives in this repository, which is public: an SSH
# username next to a domain that resolves to the host is half a credential pair
# handed out for free. Put the values in deploy.env — gitignored, see
# deploy.env.example — or in the environment.
# shellcheck source=/dev/null
[ -f "$REPO/deploy.env" ] && . "$REPO/deploy.env"

VPS="${PLANETLOGIN_VPS:?set PLANETLOGIN_VPS (ssh host or alias) in deploy.env}"
VPS_USER="${PLANETLOGIN_VPS_USER:?set PLANETLOGIN_VPS_USER in deploy.env}"
SERVICE="${PLANETLOGIN_SERVICE:?set PLANETLOGIN_SERVICE (swarm service) in deploy.env}"
HEALTH_URL="${PLANETLOGIN_HEALTH_URL:-}"
REMOTE_DIR="${PLANETLOGIN_REMOTE_DIR:-/home/$VPS_USER/planetlogin}"
SRC="./flavors/svelte/"

# Auto-tag: v<N+1> from current running image
CURRENT=$(ssh "$VPS" "sudo docker service inspect $SERVICE --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}'" 2>/dev/null || echo "planetlogin:v0")
CURRENT_NUM=$(echo "$CURRENT" | grep -oP 'v\K[0-9]+' || echo "0")
NEXT_NUM=$((CURRENT_NUM + 1))
TAG="${1:-v$NEXT_NUM}"

echo "=== PlanetLogin deploy ==="
echo "  current: $CURRENT"
echo "  building: planetlogin:$TAG"
echo ""

# 1. Send flavor source to VPS via tar (preserves VPS-side Dockerfile, package.json, config)
echo "[1/3] tar+ssh flavor -> VPS..."
tar -C "$SRC" \
  --exclude=node_modules --exclude=.svelte-kit --exclude=.git --exclude=dist \
  --exclude=Dockerfile --exclude=package.json --exclude=package-lock.json \
  --exclude=core-local --exclude=packages \
  --exclude=planetlogin.config.json --exclude='*.bak.*' \
  -cf - . \
  | ssh "$VPS" "sudo -u $VPS_USER bash -c 'mkdir -p $REMOTE_DIR && cd $REMOTE_DIR && tar xf -'"

echo "[2/3] docker build on VPS..."
ssh "$VPS" "sudo -u $VPS_USER bash -c 'cd $REMOTE_DIR && docker build -t planetlogin:$TAG . 2>&1'" | tail -5

echo "[3/3] swarm update..."
ssh "$VPS" "sudo docker service update --image planetlogin:$TAG $SERVICE 2>&1" | tail -3

echo ""
if [ -n "$HEALTH_URL" ]; then
  echo "Done. Check: curl -s $HEALTH_URL"
else
  echo "Done."
fi

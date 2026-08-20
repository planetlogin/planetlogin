#!/usr/bin/env bash
set -euo pipefail

# PlanetLogin deploy: Pi -> VPS (rsync + docker build + swarm update)
# Usage: ./deploy.sh [tag]  (default: auto-increment from current)

VPS="ricajos-vps"
VPS_USER="calcat"
REMOTE_DIR="/home/$VPS_USER/planetlogin"
SERVICE="calcat_planetlogin"
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

# 1. Sync flavor source to VPS (preserve standalone Dockerfile, package.json, config)
echo "[1/3] rsync flavor -> VPS..."
rsync -az --delete \
  --exclude=node_modules --exclude=.svelte-kit --exclude=.git --exclude=dist \
  --exclude=Dockerfile --exclude=package.json --exclude=package-lock.json \
  --exclude=core-local --exclude=packages \
  --exclude=planetlogin.config.json --exclude='*.bak.*' \
  "$SRC" "$VPS:$REMOTE_DIR/" \
  --rsync-path="sudo -u $VPS_USER rsync"

echo "[2/3] docker build on VPS..."
ssh "$VPS" "sudo -u $VPS_USER bash -c 'cd $REMOTE_DIR && docker build -t planetlogin:$TAG . 2>&1'" | tail -5

echo "[3/3] swarm update..."
ssh "$VPS" "sudo docker service update --image planetlogin:$TAG $SERVICE 2>&1" | tail -3

echo ""
echo "Done. Check: curl -s https://auth.calcat.app/health"

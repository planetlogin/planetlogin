#!/usr/bin/env bash
set -euo pipefail

# PlanetLogin deploy: tar+ssh + docker build + swarm update
# Runs from Windows or any machine with SSH to the VPS.
# Usage: ./deploy.sh [tag]  (default: auto-increment from current)
#        ALLOW_DEP_DRIFT=1 ./deploy.sh   (deploy despite a dependency mismatch)

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

# ── Dependencies live on the VPS, not here ──────────────────────────────────
# The tar below deliberately skips package.json: the VPS copy differs on purpose
# (this repo links @planetlogin/core as a workspace `file:` path, which cannot be
# installed inside the image). The cost is that bumping a dependency here does
# nothing — the deploy still goes green while the image installs the old version.
# That is exactly what happened publishing 0.4.0 of the globe: the portal passed
# `lang` and the widget ignored it, because the image had 0.3.0.
#
# So compare the two and refuse, unless the drift is one of the `file:` links
# that is supposed to differ.
LOCAL_PKG="$REPO/flavors/svelte/package.json"
REMOTE_PKG=$(ssh "$VPS" "sudo -u $VPS_USER cat $REMOTE_DIR/package.json" 2>/dev/null || true)
if [ -n "$REMOTE_PKG" ] && command -v node >/dev/null 2>&1; then
  DRIFT=$(LOCAL="$LOCAL_PKG" REMOTE="$REMOTE_PKG" node -e '
    const fs = require("fs");
    const local = JSON.parse(fs.readFileSync(process.env.LOCAL, "utf8")).dependencies ?? {};
    const remote = JSON.parse(process.env.REMOTE).dependencies ?? {};
    const out = [];
    for (const [name, want] of Object.entries(local)) {
      if (String(want).startsWith("file:")) continue;   // workspace link, differs by design
      const has = remote[name];
      if (has !== want) out.push(`  ${name}: repo ${want} -> VPS ${has ?? "(ausente)"}`);
    }
    if (out.length) console.log(out.join("
"));
  ' 2>/dev/null)
  if [ -n "$DRIFT" ]; then
    echo "The VPS installs different versions than this repo declares:" >&2
    echo "$DRIFT" >&2
    echo "" >&2
    echo "package.json is not shipped by this script, so the build would quietly" >&2
    echo "use the VPS versions. Edit $REMOTE_DIR/package.json on the VPS, or pass" >&2
    echo "--allow-dep-drift if you meant it." >&2
    [ "${ALLOW_DEP_DRIFT:-0}" = "1" ] || exit 1
  fi
fi

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

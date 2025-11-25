#!/usr/bin/env bash
set -euo pipefail

# Deploy script for frontend from a local PC
# Places built `dist/` on remote host using rsync (preferred) or scp fallback.

REMOTE_USER="${REMOTE_USER:-u3330235}"
REMOTE_HOST="${REMOTE_HOST:-podolsk.mad.moclean.ru}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/u3330235/data/www/podolsk.mad.moclean.ru}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519_mad}"
DRY_RUN="${DRY_RUN:-false}"

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Deploy script starting"
echo "Repo dir: $REPO_DIR"
echo "Remote: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

cd "$REPO_DIR"

echo "=== Step 1: ensure clean git state ==="
# Try to update repo; if offline, continue with local state
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git fetch --all --prune || true
  git pull --ff-only || true
fi

echo "=== Step 2: install dependencies (only in frontend folder) ==="
if [ -d frontend ]; then
  pushd frontend >/dev/null
  if [ -f package-lock.json ]; then
    if ! npm ci; then
      echo "npm ci failed — falling back to npm install"
      npm install
    fi
  else
    npm install
  fi
  popd >/dev/null
else
  echo "Warning: frontend folder not found, running install in repo root"
  if [ -f package-lock.json ]; then
    if ! npm ci; then
      echo "npm ci failed — falling back to npm install"
      npm install
    fi
  else
    npm install
  fi
fi

echo "=== Step 3: build ==="
# Prefer frontend build script if exists
if [ -d frontend ] && (grep -q "build" frontend/package.json 2>/dev/null || true); then
  pushd frontend >/dev/null
  npm run build
  popd >/dev/null
else
  npm run build
fi

DIST_DIR="$REPO_DIR/frontend/dist"
if [ ! -d "$DIST_DIR" ]; then
  # Fallback to top-level dist
  DIST_DIR="$REPO_DIR/dist"
fi

if [ "$DRY_RUN" = "true" ]; then
  echo "DRY_RUN enabled — skipping upload. Build is in $DIST_DIR"
  exit 0
fi

if [ ! -d "$DIST_DIR" ]; then
  echo "Error: build output directory not found: $DIST_DIR"
  exit 1
fi

echo "=== Step 4: upload dist ==="
ssh_opts=( -i "$SSH_KEY" -o BatchMode=yes -o StrictHostKeyChecking=no )
ssh ${ssh_opts[*]} "$REMOTE_USER@$REMOTE_HOST" "mkdir -p '$REMOTE_PATH'" || true

if command -v rsync >/dev/null 2>&1; then
  echo "Using rsync (recommended) with --chmod to ensure files are world-readable"
  RSYNC_SSH="ssh ${ssh_opts[*]}"
  # Use --delete to mirror the build and --chmod to set sane permissions
  rsync -az --delete --chmod=Du=rwx,Dg=rx,Do=rx,Fu=rw,Fg=r-- -e "$RSYNC_SSH" "$DIST_DIR/" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/"
else
  echo "rsync not found — falling back to scp"
  scp ${ssh_opts[*]} -r "$DIST_DIR/"* "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"
fi

echo "=== DONE. Проверь сайт: https://$REMOTE_HOST ==="


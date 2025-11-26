#!/usr/bin/env bash
set -euo pipefail

# Deploy script for frontend from a local PC
# Places built `dist/` on remote host using rsync (preferred) or scp fallback.

REMOTE_USER="${REMOTE_USER:-u3330235}"
REMOTE_HOST="${REMOTE_HOST:-podolsk.mad.moclean.ru}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/u3330235/data/www/podolsk.mad.moclean.ru}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/id_ed25519_mad}"
DRY_RUN="${DRY_RUN:-false}"
FORCE_SYNC="${FORCE_SYNC:-false}"

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Deploy script starting"
echo "Repo dir: $REPO_DIR"
echo "Remote: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

cd "$REPO_DIR"

echo "=== Step 1: ensure clean git state ==="
# Try to update repo; if offline, continue with local state
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  # fetch all remotes and prune deleted branches (don't fail whole script)
  if ! git fetch --all --prune; then
    echo "Warning: git fetch failed — continuing with local state"
  fi

  # determine current branch
  BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
  if [ -z "$BRANCH" ] || [ "$BRANCH" = "HEAD" ]; then
    echo "Warning: repository is in detached HEAD or branch unknown; attempting safe pull"
    git pull --ff-only || true
  else
    # determine upstream; prefer configured upstream, fallback to origin/$BRANCH
    UPSTREAM="$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null || true)"
    if [ -z "$UPSTREAM" ]; then
      UPSTREAM="origin/$BRANCH"
    fi

    # handle uncommitted changes: stash by default, or force reset if requested
    STASHED=0
    if [ -n "$(git status --porcelain)" ]; then
      if [ "$FORCE_SYNC" = "true" ]; then
        echo "FORCE_SYNC=true — will discard local changes and proceed with hard reset."
      else
        echo "Uncommitted changes detected — stashing before update."
        if git stash push -u -m "deploy-$(date +%s)" >/dev/null 2>&1; then
          STASHED=1
          echo "Local changes stashed (run 'git stash list' to see)."
        else
          echo "Warning: git stash failed — aborting deploy to avoid data loss."
          exit 1
        fi
      fi
    fi

    # reset local branch to upstream to ensure full sync
    if git rev-parse "$UPSTREAM" >/dev/null 2>&1; then
      echo "Resetting current branch '$BRANCH' to '$UPSTREAM'"
      git reset --hard "$UPSTREAM"
      git clean -fd || true
    else
      echo "Upstream '$UPSTREAM' not found; attempting pull --ff-only"
      git pull --ff-only || true
    fi

    if [ "$STASHED" -eq 1 ]; then
      echo "Note: local changes were stashed. To restore: 'git stash pop' (may conflict)."
    fi
  fi
fi

echo "=== Step 2: install dependencies (only in frontend folder) ==="
if [ -d frontend ]; then
  pushd frontend >/dev/null
  if [ -f package-lock.json ]; then
    echo "Running: npm ci (will fallback to npm install on failure)"
    # Try a clean install first. If lockfile is out of sync or npm reports an error,
    # fall back to `npm install` which may update `package-lock.json` locally.
    if npm ci --no-audit --no-fund; then
      echo "npm ci succeeded"
    else
      echo "npm ci failed — falling back to npm install (this may update package-lock.json)"
      npm install --no-audit --no-fund
    fi
  else
    npm install --no-audit --no-fund
  fi
  popd >/dev/null
else
  echo "Warning: frontend folder not found, running install in repo root"
  if [ -f package-lock.json ]; then
    echo "Running: npm ci (will fallback to npm install on failure)"
    if npm ci --no-audit --no-fund; then
      echo "npm ci succeeded"
    else
      echo "npm ci failed — falling back to npm install (this may update package-lock.json)"
      npm install --no-audit --no-fund
    fi
  else
    npm install --no-audit --no-fund
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
ssh_opts=( -i "$SSH_KEY" -o BatchMode=yes -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null )

# Ensure local SSH dir exists (Git Bash / Windows can fail creating it automatically)
mkdir -p "$HOME/.ssh" >/dev/null 2>&1 || true
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


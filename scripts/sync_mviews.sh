#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/srv/apps/mad-podolsk-api"
BRANCH="${BRANCH:-main}"

FORCE="${1:-}"

echo ">>> cd $REPO_DIR"
cd "$REPO_DIR"

echo ">>> Checking git status..."
if git status --porcelain | grep -q .; then
  if [ "$FORCE" = "--force-clean" ]; then
    echo ">>> Force cleaning local changes..."
    git reset --hard HEAD
    git clean -fd
  else
    echo "!!! Репозиторий имеет незакоммиченные изменения."
    echo "    Запусти с --force-clean если хочешь всё сбросить:"
    echo "        mad_mv_sync --force-clean"
    exit 1
  fi
fi

echo ">>> Fetch & pull from origin/$BRANCH..."
git fetch origin
git pull --ff-only origin "$BRANCH"

echo ">>> Exporting table schema..."
scripts/export_schema.sh

echo ">>> Exporting materialized views..."
scripts/export_mviews.sh

echo ">>> Done."

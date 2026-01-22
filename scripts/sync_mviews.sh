#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/srv/apps/mad-podolsk-api"
BRANCH="${BRANCH:-main}"

echo ">>> cd $REPO_DIR"
cd "$REPO_DIR"

echo ">>> Checking git status..."
if git status --porcelain | grep -q .; then
  echo "!!! Репозиторий имеет незакоммиченные изменения."
  echo "    Сделай commit/stash сначала, чтобы не потерять работу."
  exit 1
fi

echo ">>> Fetch & pull from origin/$BRANCH..."
git fetch origin
git pull --ff-only origin "$BRANCH"

echo ">>> Exporting materialized views and pushing..."
scripts/export_mviews.sh

echo ">>> Done."

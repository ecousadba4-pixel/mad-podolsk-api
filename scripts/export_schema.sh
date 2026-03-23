#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="/srv/apps/mad-podolsk-api"
EXPORT_DIR="app/db/schema/full"
SCHEMAS=("public" "initial_data")
BRANCH="main"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

cd "$PROJECT_ROOT"

REMOTE="$(git config --get "branch.${BRANCH}.remote" || true)"
if [[ -z "$REMOTE" ]]; then
  REMOTE="origin"
fi

git remote get-url "$REMOTE" >/dev/null 2>&1 || fail "git remote '$REMOTE' not found"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
  fail "current branch is '$CURRENT_BRANCH', expected '$BRANCH'"
fi

command -v pg_dump >/dev/null 2>&1 || fail "pg_dump not found in PATH"

log "Using remote: $REMOTE"
log "Using branch: $BRANCH"

# Перед обновлением репозитория рабочее дерево должно быть чистым.
if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "working tree has uncommitted changes. Commit/stash them first."
fi

log "Pulling latest changes from $REMOTE/$BRANCH..."
git pull --rebase "$REMOTE" "$BRANCH"

mkdir -p "$EXPORT_DIR"

log "Exporting full schema for: ${SCHEMAS[*]} into '$EXPORT_DIR'..."

for schema in "${SCHEMAS[@]}"; do
  out_file="$EXPORT_DIR/${schema}.sql"
  log "  -> schema $schema -> $out_file"

  pg_dump \
    --schema-only \
    --no-owner \
    --no-privileges \
    --schema="$schema" \
    > "$out_file"
done

log "Export finished. Checking changes..."

if git diff --quiet -- "$EXPORT_DIR"; then
  log "No schema changes detected. Nothing to commit."
  exit 0
fi

git add "$EXPORT_DIR"

COMMIT_MSG="Update full DB schema ($(date '+%Y-%m-%d %H:%M:%S'))"
log "Committing changes..."
git commit -m "$COMMIT_MSG"

log "Pushing to $REMOTE/$BRANCH..."
git push "$REMOTE" "$BRANCH"

log "Done."

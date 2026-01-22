#!/usr/bin/env bash
set -euo pipefail

### НАСТРОЙКИ ###

# DSN к БД (как в export_mviews.sh)
DB_URL="postgresql://app_mad_podolsk:MA9Cs3eLu5QdJ2XVBZNJ@10.0.1.1:5433/app_mad_podolsk"

# Список схем, которые выгружаем полностью
SCHEMAS="${SCHEMAS:-public initial_data}"

# Куда складываем DDL
OUT_DIR="${OUT_DIR:-app/db/schema}"

# Комментарий к коммиту
COMMIT_MSG_PREFIX="${COMMIT_MSG_PREFIX:-Update full DB schema}"

# Ветка
BRANCH="${BRANCH:-main}"

### ЛОГИКА ###

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

mkdir -p "$OUT_DIR"

echo "Exporting full schema for: $SCHEMAS into '$OUT_DIR'..."

for schema in $SCHEMAS; do
  file="$OUT_DIR/${schema}.sql"
  echo "  -> schema $schema -> $file"

  # Полный дамп схемы (только структура, без данных)
  pg_dump "$DB_URL" -s -n "$schema" > "$file"
done

echo "Export finished. Checking git status..."

did_commit=0

if git status --porcelain | grep -q .; then
  echo "Changes detected. Committing..."
  git add "$OUT_DIR"

  ts="$(date +'%Y-%m-%d %H:%M:%S')"
  git commit -m "$COMMIT_MSG_PREFIX ($ts)" && did_commit=1 || echo "Nothing to commit."
else
  echo "No changes in schema files."
fi

if [ "$did_commit" -eq 1 ]; then
  echo "Pushing to remote..."
  git push origin "$BRANCH"
else
  echo "No new commit, skipping push."
fi

echo "Done."

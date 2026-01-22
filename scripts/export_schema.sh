#!/usr/bin/env bash
set -euo pipefail

### НАСТРОЙКИ ###

# Используем тот же DSN, что и в export_mviews.sh
DB_URL="postgresql://app_mad_podolsk:MA9Cs3eLu5QdJ2XVBZNJ@10.0.1.1:5433/app_mad_podolsk"

# Схема, чью структуру выгружаем
SCHEMA="${SCHEMA:-public}"

# Куда складываем DDL таблиц
OUT_DIR="${OUT_DIR:-app/db/schema}"

# Комментарий к коммиту
COMMIT_MSG_PREFIX="${COMMIT_MSG_PREFIX:-Update table schema}"

# Ветка
BRANCH="${BRANCH:-main}"

### ЛОГИКА ###

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

mkdir -p "$OUT_DIR"

echo "Exporting table schema from schema '$SCHEMA' into '$OUT_DIR'..."

# Список обычных таблиц
tables=$(psql "$DB_URL" -At -c "
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = '$SCHEMA'
    ORDER BY tablename;
")

if [ -z "$tables" ]; then
  echo "No tables found in schema '$SCHEMA'."
  exit 0
fi

for tbl in $tables; do
  file="$OUT_DIR/${tbl}.sql"
  echo "  -> $SCHEMA.$tbl -> $file"

  # Выгружаем DDL таблицы (со всеми индексами/констрейнтами и т.п.)
  pg_dump "$DB_URL" -s -t "$SCHEMA.$tbl" > "$file"
done

echo "Export finished. Checking git status..."

did_commit=0

if git status --porcelain | grep -q .; then
  echo "Changes detected. Committing..."
  git add "$OUT_DIR"

  ts="$(date +'%Y-%m-%d %H:%M:%S')"
  git commit -m "$COMMIT_MSG_PREFIX ($ts)" && did_commit=1 || echo "Nothing to commit."
else
  echo "No changes in table schema."
fi

if [ "$did_commit" -eq 1 ]; then
  echo "Pushing to remote..."
  git push origin "$BRANCH"
else
  echo "No new commit, skipping push."
fi

echo "Done."

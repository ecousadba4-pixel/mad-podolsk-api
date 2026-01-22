#!/usr/bin/env bash
set -euo pipefail

### НАСТРОЙКИ ###

# DSN к БД. Лучше всего использовать тот же DB_DSN, что и у backend.
# пример: export DB_DSN="postgresql://user:pass@localhost:5432/dbname"
DB_URL="postgresql://app_mad_podolsk:MA9Cs3eLu5QdJ2XVBZNJ@10.0.1.1:5433/app_mad_podolsk"

# Схема, где лежат MV
SCHEMA="${SCHEMA:-public}"

# Каталог внутри репо для MV
OUT_DIR="${OUT_DIR:-app/db/mviews}"

# Комментарий к коммиту
COMMIT_MSG_PREFIX="${COMMIT_MSG_PREFIX:-Update materialized views}"

# Ветка, в которую пушим
BRANCH="${BRANCH:-main}"

### ЛОГИКА ###

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

mkdir -p "$OUT_DIR"

echo "Exporting materialized views from schema '$SCHEMA' into '$OUT_DIR'..."

# Получаем список MV в схеме
mvs=$(psql "$DB_URL" -At -c "
    SELECT matviewname
    FROM pg_matviews
    WHERE schemaname = '$SCHEMA'
    ORDER BY matviewname;
")

if [ -z "$mvs" ]; then
  echo "No materialized views found in schema '$SCHEMA'."
  exit 0
fi

for mv in $mvs; do
  file="$OUT_DIR/${mv}.sql"
  echo "  -> $mv -> $file"

  # Генерируем DDL
  psql "$DB_URL" -At -c "
    SELECT
      '-- schema: ' || schemaname || E'\n' ||
      '-- name: '   || matviewname || E'\n\n' ||
      'CREATE MATERIALIZED VIEW ' ||
      quote_ident(schemaname) || '.' || quote_ident(matviewname) ||
      E' AS\n' ||
      pg_get_viewdef((schemaname || '.' || matviewname)::regclass, true) ||
      E';'
    FROM pg_matviews
    WHERE schemaname = '$SCHEMA'
      AND matviewname = '$mv';
  " > "$file"
done

echo "Export finished. Checking git status..."

did_commit=0

# Проверяем, есть ли изменения
if git status --porcelain | grep -q .; then
  echo "Changes detected. Committing..."
  git add "$OUT_DIR"

  ts="$(date +'%Y-%m-%d %H:%M:%S')"
  git commit -m "$COMMIT_MSG_PREFIX ($ts)" && did_commit=1 || echo "Nothing to commit."
else
  echo "No changes in materialized views."
fi

# Если был коммит — пушим на GitHub
if [ "$did_commit" -eq 1 ]; then
  echo "Pushing to remote..."
  git push origin "$BRANCH"
else
  echo "No new commit, skipping push."
fi

echo "Done."

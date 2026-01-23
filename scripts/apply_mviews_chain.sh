#!/usr/bin/env bash
set -euo pipefail

# === НАСТРОЙКИ ===

DB_URL="postgresql://app_mad_podolsk:MA9Cs3eLu5QdJ2XVBZNJ@10.0.1.1:5433/app_mad_podolsk"
SCHEMA="${SCHEMA:-public}"
MVIEW_DIR="${MVIEW_DIR:-app/db/mviews}"

# Порядок пересоздания MV (от "нижних" к "верхним" в цепочке)
MVS=(
  mv_work_actual_daily_value
  mv_work_plan_monthly_value
  mv_work_actual_daily_value_rows
  mv_work_plan_vs_actual_monthly_value
  mv_work_plan_actual_monthly_summary
  mv_excess_road_km_1km
  mv_excess_road_area_10000m2
  mv_excess_sidewalk_area_1000m2
  mv_excess_monthly_by_work
)

# === ЛОГИКА ===

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_DIR"

echo ">>> Repo dir: $REPO_DIR"
echo ">>> Updating repo from Git (git pull --ff-only)..."
git pull --ff-only
echo

echo "Capturing indexes for all materialized views before any DROP..."
echo

# Ассоциативный массив: mv_name -> все её CREATE INDEX
declare -A INDEX_MAP

for mv in "${MVS[@]}"; do
  echo ">>> capturing indexes for ${SCHEMA}.${mv}..."
  indexes=$(psql "$DB_URL" -At -c "
    SELECT indexdef
    FROM pg_indexes
    WHERE schemaname = '${SCHEMA}'
      AND tablename  = '${mv}';
  ")
  INDEX_MAP["$mv"]="$indexes"

  if [ -n "$indexes" ]; then
    echo "$indexes" | sed 's/^/    /'
  else
    echo "    no indexes found."
  fi
  echo
done

echo
echo "Recreating materialized views in schema '$SCHEMA' from '$MVIEW_DIR'..."
echo

for mv in "${MVS[@]}"; do
  file="$MVIEW_DIR/${mv}.sql"

  echo "=== $mv ==="

  if [ ! -f "$file" ]; then
    echo "  [WARN] SQL file not found: $file (skip)"
    echo
    continue
  fi

  # 1) Drop MV (может каскадно снести зависящие, но индексы мы уже сохранили)
  echo "  -> dropping ${SCHEMA}.${mv} (if exists)..."
  psql "$DB_URL" -v ON_ERROR_STOP=1 -c \
    "DROP MATERIALIZED VIEW IF EXISTS ${SCHEMA}.\"${mv}\" CASCADE;"

  # 2) Create MV из файла (уже обновлённого из Git)
  echo "  -> creating from $file..."
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$file"

  # 3) Восстанавливаем индексы, которые сохранили ДО всех drop’ов
  indexes="${INDEX_MAP[$mv]:-}"

  if [ -n "$indexes" ]; then
    echo "  -> recreating indexes..."
    # добавляем ; в конец каждой строки
    echo "$indexes" | sed 's/$/;/' | psql "$DB_URL" -v ON_ERROR_STOP=1
  else
    echo "  -> no indexes to recreate."
  fi

  echo "  [OK] $mv"
  echo
done

echo "All materialized views in chain have been recreated from latest Git (with indexes)."

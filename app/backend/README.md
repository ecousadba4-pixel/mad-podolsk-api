# Backend (FastAPI) для SKPDI Dashboard

Эта папка содержит FastAPI-сервер для Dashboard SKPDI.

## API Version

**Текущая версия: v1**

API использует версионирование через URL-префикс `/api/v1/`. Это обеспечивает:
- Строгий контракт без fallback на устаревшие форматы
- Возможность безопасных миграций в будущем
- Чёткое разделение между версиями API

## Как запустить локально

1) Установите зависимости (рекомендуется в venv):

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r ../../requirements.txt
```

2) Перед запуском задайте переменную окружения `DB_DSN`:

```bash
export DB_DSN="postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require"
```

3) Запустите uvicorn:

```bash
uvicorn app.backend.main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints (v1)

Базовый путь: `/api/v1/dashboard`

| Endpoint | Описание |
|----------|----------|
| `GET /monthly/summary?month=YYYY-MM` | Сводка по контракту и KPI |
| `GET /monthly/by-smeta?month=YYYY-MM` | Карточки смет |
| `GET /monthly/daily-revenue?month=YYYY-MM` | Выручка по дням |
| `GET /monthly/dates?month=YYYY-MM` | Доступные даты |
| `GET /monthly/smeta-details?month=YYYY-MM&smeta_key=KEY` | Детализация сметы |
| `GET /monthly/smeta-details-with-types?month=YYYY-MM&smeta_key=KEY` | Детализация с типами работ |
| `GET /monthly/smeta-description-daily?month=YYYY-MM&smeta_key=KEY&description_id=ID` | Дневная разбивка описания |
| `GET /monthly/fact-by-type-of-work?month=YYYY-MM` | Факт по типам работ |
| `GET /daily?date=YYYY-MM-DD` | Дневной отчёт |
| `GET /months?limit=N` | Доступные месяцы |
| `GET /last-loaded` | Время последней загрузки |
| `POST /invalidate-cache` | Инвалидация кэша (требует X-Invalidation-Token) |

### О description_id

Для избежания длинных URL с кириллицей в качестве параметра, API использует `description_id`:
- Это короткий 12-символьный хэш (SHA256), генерируемый из строки description
- `description_id` возвращается в ответах `/smeta-details` и `/smeta-details-with-types`
- Фронтенд использует `description_id` для запросов к `/smeta-description-daily`

## Миграция с устаревшего API

Комбинированный эндпоинт `GET /api/dashboard` удалён в v1. Используйте специализированные эндпоинты:

| Старый формат | Новый эндпоинт v1 |
|--------------|-------------------|
| `GET /api/dashboard` | Используйте комбинацию: `/monthly/summary`, `/monthly/by-smeta`, `/months` |
| `summary.contract_amount` | `contract.summa_contract` |
| `summary.fact_amount` | `kpi.fact_total` |
| `summary.planned_amount` | `kpi.plan_total` |

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `DB_DSN` | PostgreSQL connection string |
| `CACHE_INVALIDATION_TOKEN` | Токен для эндпоинта инвалидации кэша |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) |

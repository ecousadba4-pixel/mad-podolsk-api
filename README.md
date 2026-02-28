# МАД Подольск — СКПДИ Dashboard

> Веб-приложение для мониторинга и управления выполнением работ по контракту СКПДИ (содержание дорог) в Подольске.
> Включает дашборд с KPI, управление ресурсами (техника/люди), отслеживание пробега, расхода топлива, расценок и участков дорог.

---

## Оглавление

- [Общая архитектура](#общая-архитектура)
- [Стек технологий](#стек-технологий)
- [Структура репозитория](#структура-репозитория)
- [Backend (FastAPI)](#backend-fastapi)
  - [Слоистая архитектура](#слоистая-архитектура)
  - [API Endpoints (v1)](#api-endpoints-v1)
  - [Кэширование](#кэширование)
  - [Аутентификация](#аутентификация)
  - [Подключение к БД](#подключение-к-бд)
- [Frontend (Vue 3)](#frontend-vue-3)
  - [Маршрутизация](#маршрутизация)
  - [State Management (Pinia)](#state-management-pinia)
  - [API-клиент](#api-клиент)
  - [Компоненты](#компоненты)
  - [Composables](#composables)
  - [Стили и дизайн-система](#стили-и-дизайн-система)
  - [Типизация](#типизация)
- [База данных (PostgreSQL)](#база-данных-postgresql)
- [Скрипты](#скрипты)
- [Деплой (Coolify)](#деплой-coolify)
- [Локальная разработка](#локальная-разработка)
- [Переменные окружения](#переменные-окружения)
- [Документация](#документация)

---

## Общая архитектура

```
┌──────────────────────┐       ┌──────────────────────┐       ┌──────────────────────┐
│      Frontend        │       │       Backend        │       │     PostgreSQL        │
│   Vue 3 + Vite       │──────▶│      FastAPI         │──────▶│   (2 схемы:          │
│   Nginx (production) │  HTTP │   Uvicorn (ASGI)     │  SQL  │   public,             │
│   SPA + KeepAlive    │       │   41 endpoint        │       │   initial_data)       │
└──────────────────────┘       └──────────────────────┘       └──────────────────────┘
        :8080 / Coolify              :8000 / Coolify             :5432 (VPS)

Оба сервиса деплоятся в Docker через Coolify на VPS.
Frontend проксирует /api → Backend в dev-режиме.
```

**Ключевые принципы:**
- Монорепо: backend + frontend + SQL + скрипты в одном репозитории
- Backend: **Router → Service → Repository → DB** (4-слойная архитектура)
- Frontend: **View → Store → API Client → Backend** (однонаправленный поток данных)
- API версионирование через URL-префикс `/api/v1/`
- Аутентификация через cookie-сессии (bcrypt, sliding window TTL)
- Кэширование на бэкенде: TTL-кэши с автоинвалидацией при обновлении ETL-данных

---

## Стек технологий

| Слой | Технологии |
|------|------------|
| **Frontend** | Vue 3.5 (Composition API, `<script setup>`), Vite 7, Pinia 3, Vue Router 4, TypeScript 5.9, SCSS (CSS Layers + custom properties), UnoCSS, @tanstack/vue-virtual |
| **Backend** | Python 3.12, FastAPI, Uvicorn, psycopg2 (ThreadedConnectionPool), Pydantic/pydantic-settings, bcrypt, reportlab |
| **БД** | PostgreSQL, Materialized Views (11 шт. для агрегации), 2 схемы (public + initial_data) |
| **Инфраструктура** | Docker, Nginx (SPA), Coolify (CI/CD), Let's Encrypt (SSL) |
| **Качество** | Stylelint, vue-tsc (strict), PostCSS (PurgeCSS + cssnano + autoprefixer), gzip + brotli compression |

---

## Структура репозитория

```
mad-podolsk-api/
├── Dockerfile                      # Backend Docker (Python 3.12-slim + Uvicorn)
├── requirements.txt                # Python-зависимости backend
├── README.md                       # ← Этот файл
│
├── app/
│   ├── backend/                    # FastAPI-сервер
│   │   ├── main.py                 # Точка входа, lifespan, CORS, подключение роутеров
│   │   ├── db.py                   # Пул соединений (ThreadedConnectionPool + ThreadPoolExecutor)
│   │   ├── db_resources.py         # Отдельный пул для БД ресурсов (DB_DSN_RESOURCES)
│   │   ├── dashboard.py            # Proxy-модуль (обратная совместимость)
│   │   ├── routers/                # 7 роутеров (HTTP-обработчики)
│   │   │   ├── dashboard.py        #   /api/v1/dashboard — 11 endpoints (дашборд)
│   │   │   ├── auth.py             #   /api/v1/auth — 7 endpoints (аутентификация)
│   │   │   ├── resources.py        #   /api/v1/resources — 14 endpoints (техника/люди)
│   │   │   ├── fuel.py             #   /api/v1/fuel — 3 endpoints (топливо)
│   │   │   ├── mileage.py          #   /api/v1/mileage — 2 endpoints (пробег)
│   │   │   ├── prices.py           #   /api/v1/prices — 2 endpoints (расценки)
│   │   │   └── road_sections.py    #   /api/v1/road-sections — 1 endpoint (участки дорог)
│   │   ├── services/               # Бизнес-логика
│   │   │   ├── dashboard_service.py#   Фасад — реэкспорт из summary/daily/smeta
│   │   │   ├── summary_service.py  #   Месячные сводки, KPI, контракт
│   │   │   ├── daily_service.py    #   Дневная выручка, разбивка по дням
│   │   │   ├── smeta_service.py    #   Детализация смет, description_id хэши
│   │   │   ├── auth_service.py     #   Аутентификация (bcrypt, сессии)
│   │   │   ├── resources_service.py#   CRUD смен, справочники, сводки
│   │   │   ├── fuel_service.py     #   Расход топлива
│   │   │   ├── mileage_service.py  #   Пробег (по дате, по машине, почасовой)
│   │   │   ├── prices_service.py   #   Расценки с фильтрами
│   │   │   ├── road_sections_service.py  # Участки дорог
│   │   │   ├── cache.py            #   AsyncTTLCache / AsyncKeyedTTLCache
│   │   │   └── common.py           #   Утилиты: SMETA_LABELS, LRUDescriptionCache
│   │   ├── repositories/           # SQL-запросы
│   │   │   ├── dashboard_repo.py   #   17+ функций (MV, CTE, агрегации)
│   │   │   ├── auth_repo.py        #   CRUD users + sessions
│   │   │   ├── resources_repo.py   #   Equipment/Master shifts, audit log, summary
│   │   │   ├── fuel_repo.py        #   JOIN dim_daily_gas_limit + fact_daily_card_fuel
│   │   │   ├── mileage_repo.py     #   fact_vehicle_mileage + dim_vehicles
│   │   │   ├── prices_repo.py      #   fact_price_2026_upto_may + dims
│   │   │   └── road_sections_repo.py  # dim_road_section
│   │   └── schemas/                # Pydantic-модели (request/response)
│   │       ├── dashboard.py        #   ~20 моделей (Summary, Smeta, Daily, KPI...)
│   │       ├── auth.py             #   Login, User CRUD, Session
│   │       ├── resources.py        #   Equipment/Master shifts, Summary, справочники
│   │       ├── fuel.py             #   FuelGeneral, FuelByDriver
│   │       ├── mileage.py          #   MileageByDate, MileageByVehicle (+ hourly)
│   │       ├── prices.py           #   PriceRow, фильтры
│   │       └── road_sections.py    #   RoadSection
│   │
│   └── db/                         # SQL-артефакты
│       ├── mviews/                 # 11 Materialized Views (экспорт из БД)
│       │   ├── mv_work_plan_actual_monthly_summary.sql
│       │   ├── mv_work_plan_vs_actual_monthly_value.sql
│       │   ├── mv_work_actual_daily_value.sql
│       │   ├── mv_work_actual_daily_value_rows.sql
│       │   ├── mv_work_plan_monthly_value.sql
│       │   ├── mv_excess_monthly_by_work.sql
│       │   ├── mv_excess_road_km_1km.sql
│       │   ├── mv_excess_road_area_10000m2.sql
│       │   ├── mv_excess_sidewalk_area_1000m2.sql
│       │   ├── mv_excess_rotor.sql
│       │   └── mv_vehicle_expected_fuel_daily.sql
│       └── schema/full/            # Полный DDL-экспорт схем БД
│           ├── public.sql          #   ~2000 строк (таблицы, индексы, MV)
│           └── initial_data.sql    #   ~770 строк (начальные данные, факты)
│
├── frontend/                       # Vue 3 SPA
│   ├── Dockerfile                  # Multi-stage: Node 20 → Nginx Alpine
│   ├── package.json                # Vue 3.5, Pinia 3, Vite 7, TypeScript 5.9
│   ├── vite.config.js              # Code splitting, gzip/brotli, proxy /api
│   ├── unocss.config.js            # presetUno + presetAttributify
│   ├── tsconfig.json               # strict, noUnusedLocals, bundler resolution
│   ├── src/
│   │   ├── main.ts                 # Точка входа (Pinia, Router, QueryClient, Auth Guard)
│   │   ├── App.vue                 # Корень (Suspense, KeepAlive, ErrorBoundary, Toast)
│   │   ├── router/index.ts         # 10 маршрутов (lazy-loaded views)
│   │   ├── api/                    # HTTP-клиент (retry, AbortSignal)
│   │   │   ├── client.ts           #   Базовый клиент с exponential backoff
│   │   │   ├── dashboard.ts        #   11 endpoints дашборда
│   │   │   ├── auth.ts             #   7 endpoints аутентификации
│   │   │   ├── resources.ts        #   14 endpoints ресурсов
│   │   │   ├── fuel.ts             #   3 endpoints топлива
│   │   │   ├── mileage.ts          #   2 endpoints пробега
│   │   │   ├── prices.ts           #   2 endpoints расценок
│   │   │   └── roadSections.ts     #   1 endpoint участков дорог
│   │   ├── store/                  # Pinia-хранилища
│   │   │   ├── dashboardUiStore.ts #   Глобальный UI: mode, selectedMonth
│   │   │   ├── monthlyStore.ts     #   KPI, контракт, доступные месяцы
│   │   │   ├── dailyStore.ts       #   Работы за день, доступные даты
│   │   │   ├── smetaStore.ts       #   Карточки смет, детализация, drill-down
│   │   │   ├── authStore.ts        #   Сессии, пользователи, RBAC
│   │   │   ├── pricesStore.ts      #   Расценки с debounced-поиском
│   │   │   ├── roadSectionsStore.ts#   Участки дорог
│   │   │   ├── resourcesStore.ts   #   Техника, мастера, смены (CRUD)
│   │   │   ├── mileageStore.ts     #   Пробег по дате / по машине
│   │   │   ├── fuelStore.ts        #   Топливо (общее / по водителю)
│   │   │   └── helpers.ts          #   Нормализация данных, SMETA_LABELS
│   │   ├── views/                  # Страницы (lazy-loaded)
│   │   │   ├── LoginView.vue
│   │   │   ├── dashboard/
│   │   │   │   ├── MonthlyDashboardView.vue   # Главная — KPI + контракт + сметы
│   │   │   │   ├── DailyDashboardView.vue     # Работы за день
│   │   │   │   └── SmetaBreakdownView.vue     # Drill-down по смете
│   │   │   ├── PricesView.vue
│   │   │   ├── RoadSectionsView.vue
│   │   │   ├── UsersView.vue                  # Admin-only
│   │   │   ├── ResourcesView.vue
│   │   │   ├── MileageView.vue
│   │   │   ├── FuelView.vue
│   │   │   ├── fuel/               # Под-views топлива
│   │   │   ├── mileage/            # Под-views пробега
│   │   │   └── resources/          # Под-views ресурсов
│   │   ├── components/
│   │   │   ├── ui/                 # Дизайн-система (UiBadge, UiButton, UiCard...)
│   │   │   ├── common/             # ErrorBoundary, ToastContainer, NavMenu
│   │   │   ├── layouts/            # AppHeader, CardsGrid, PageSection
│   │   │   ├── dashboard/          # KPI-секции, модальные окна, таблицы
│   │   │   ├── fuel/               # Таблицы и фильтры топлива
│   │   │   ├── mileage/            # Таблицы и фильтры пробега
│   │   │   ├── pickers/            # Календарь, выбор даты/месяца/времени
│   │   │   └── resources/          # Формы смен, сводки техники
│   │   ├── composables/            # Vue composables (хуки)
│   │   ├── styles/                 # SCSS (CSS Layers + tokens + dark theme)
│   │   ├── types/                  # TypeScript типы (dashboard.d.ts, api.generated.d.ts)
│   │   └── utils/                  # Форматирование, debounce, groupBy и т.д.
│   └── scripts/
│       ├── generate-api-types.py   # Авто-генерация TS типов из Pydantic-схем
│       └── check-tokens.cjs        # Проверка SCSS дизайн-токенов
│
├── scripts/                        # Bash-скрипты для работы с БД
│   ├── apply_mviews_chain.sh       # Пересоздание MV в правильном порядке зависимостей
│   ├── export_mviews.sh            # Экспорт DDL всех MV из БД в app/db/mviews/
│   ├── export_schema.sh            # Экспорт полных схем (public, initial_data) в DDL
│   └── sync_mviews.sh              # Git pull + export + apply в одном скрипте
│
└── docs/                           # Проектная документация
    ├── frontend-spec.md            # Полная спецификация фронтенда
    ├── бизнес логика дашборда.md   # Формулы KPI, логика расчётов
    └── Расшифровка по типу работы.md
```

---

## Backend (FastAPI)

### Слоистая архитектура

```
HTTP Request
     │
     ▼
┌─────────────┐   Валидация входных данных (Query/Body params)
│   Router    │   Dependency Injection (auth, admin)
└──────┬──────┘
       │
       ▼
┌─────────────┐   Бизнес-логика, вычисления, кэширование
│   Service   │   Формирование ответа (Pydantic schemas)
└──────┬──────┘
       │
       ▼
┌─────────────┐   SQL-запросы (psycopg2, RealDictCursor)
│ Repository  │   CTE, JOIN, GROUP BY, FULL OUTER JOIN
└──────┬──────┘
       │
       ▼
┌─────────────┐   ThreadedConnectionPool + run_in_executor
│     DB      │   Retry с таймаутом (5s), health check
└─────────────┘
```

**Точка входа:** `app.backend.main:app` — создаёт FastAPI с lifespan (init/close DB pool), подключает 7 роутеров, настраивает CORS.

### API Endpoints (v1)

Все эндпоинты используют префикс `/api/v1/`. Всего: **41 endpoint** (27 GET, 9 POST, 3 PUT, 2 DELETE) + 1 health check.

#### Dashboard — `/api/v1/dashboard` (11 endpoints)

| Метод | Путь | Параметры | Описание |
|-------|------|-----------|----------|
| GET | `/monthly/summary` | `month` (YYYY-MM) | Сводка: KPI (план/факт/дельта), контракт (сумма/% исполнения) |
| GET | `/monthly/by-smeta` | `month` | 3 карточки смет (лето/зима/внерегламент) с plan/fact/progress |
| GET | `/monthly/daily-revenue` | `month` | Ежедневная выручка за месяц |
| GET | `/monthly/dates` | `month` | Список дат с данными в месяце |
| GET | `/monthly/smeta-details` | `month`, `smeta_key` | Детализация сметы (план/факт по описанию работ) |
| GET | `/monthly/smeta-details-with-types` | `month`, `smeta_key` | Детализация с группировкой по типу работ |
| GET | `/monthly/smeta-description-daily` | `month`, `smeta_key`, `description_id` | Ежедневная разбивка описания (12-char SHA256 hash) |
| GET | `/monthly/fact-by-type-of-work` | `month` | Агрегация факта по типам работ |
| GET | `/daily` | `date` (YYYY-MM-DD) | Разбивка работ за конкретный день |
| GET | `/months` | `limit` (1-120) | Список доступных месяцев |
| GET | `/last-loaded` | — | Дата последней ETL-загрузки |
| POST | `/invalidate-cache` | Header: `X-Invalidation-Token` | Инвалидация всех кэшей |

#### Auth — `/api/v1/auth` (7 endpoints)

| Метод | Путь | Описание | Доступ |
|-------|------|----------|--------|
| POST | `/login` | Аутентификация (cookie session_id, TTL 10 дней) | Публичный |
| POST | `/logout` | Удаление сессии | Авторизован |
| GET | `/me` | Информация о текущем пользователе | Авторизован |
| GET | `/users` | Список пользователей (фильтры: search, role, is_active) | Admin |
| POST | `/users` | Создание пользователя | Admin |
| PUT | `/users/{user_id}` | Обновление пользователя | Admin |
| POST | `/users/{user_id}/reset-password` | Сброс пароля (force re-login) | Admin |

#### Resources — `/api/v1/resources` (14 endpoints)

Справочники:
| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/references/equipment-types` | Типы техники |
| GET | `/references/vehicles` | Машины (фильтр по типу) |
| GET | `/references/drivers` | Водители (КДМ/Техника) |
| GET | `/references/masters` | Мастера |
| GET | `/references/rented-plate-numbers` | Гос. номера арендованной техники |

CRUD смен техники и мастеров:
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/equipment-shifts` | Создание смены техники |
| POST | `/equipment-shifts/search` | Поиск смены (номер + дата) |
| PUT | `/equipment-shifts/{id}` | Обновление смены |
| DELETE | `/equipment-shifts/{id}` | Мягкое удаление (причина 5-100 символов) |
| POST | `/master-shifts` | Создание смены мастера |
| POST | `/master-shifts/search` | Поиск смены мастера |
| PUT | `/master-shifts/{id}` | Обновление смены мастера |
| DELETE | `/master-shifts/{id}` | Мягкое удаление |
| GET | `/summary` | Сводка по технике и людям (фильтр по дате/времени) |

Все мутации логируются в аудит-таблицу `fact_resources_change_log` (JSONB old_data/new_data).

#### Fuel — `/api/v1/fuel` (3 endpoints)

| Метод | Путь | Параметры | Описание |
|-------|------|-----------|----------|
| GET | `/general` | `date` или `date_from`+`date_to` | Расход топлива (общий) |
| GET | `/by-driver` | `employee_id`, `date_from`, `date_to` | Ежедневный расход водителя |
| GET | `/drivers` | — | Водители с топливными картами |

#### Mileage — `/api/v1/mileage` (2 endpoints)

| Метод | Путь | Параметры | Описание |
|-------|------|-----------|----------|
| GET | `/by-date` | `date`, `time_from?`, `time_to?` | Пробег по машинам за дату |
| GET | `/by-vehicle` | `vehicles_id`, `date_from`, `date_to`, `by_hours?` | Дневной/почасовой пробег машины |

#### Prices — `/api/v1/prices` (2 endpoints)

| Метод | Путь | Параметры | Описание |
|-------|------|-----------|----------|
| GET | `/` | `search?`, `estimate_id?`, `work_type_id?` | Список расценок |
| GET | `/filters` | — | Справочники смет и типов работ |

#### Road Sections — `/api/v1/road-sections` (1 endpoint)

| Метод | Путь | Параметры | Описание |
|-------|------|-----------|----------|
| GET | `/` | `search?` | Участки дорог (ILIKE-поиск от 3 символов) |

#### Health — `/api/health`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Статус приложения + проверка БД (SELECT 1) |

### Кэширование

Два типа кэшей (модуль `services/cache.py`):

- **`AsyncTTLCache`** — кэш одного значения с TTL. Async-safe через `asyncio.Lock`.
- **`AsyncKeyedTTLCache`** — кэш по ключам (кортежам) с TTL и `max_entries`. LRU-эвикция при переполнении.

| Кэш | TTL | Max | Назначение |
|-----|-----|-----|------------|
| `MONTHS_CACHE` | 120с | 1 | Доступные месяцы |
| `LAST_LOADED_CACHE` | 15с | 1 | Дата последней ETL-загрузки |
| `COMBINED_DASHBOARD_CACHE` | 30с | 24 | Основной дашборд (deprecated) |
| `DAILY_REVENUE_CACHE` | 30с | 24 | Дневная выручка |
| `SMETA_DETAILS_CACHE` | 60с | 50 | Детали смет |
| `SMETA_DETAILS_TYPES_CACHE` | 60с | 50 | Детали с типами работ |

Автоинвалидация: при изменении `loaded_at` в `etl_load_state` все кэши сбрасываются. Принудительная инвалидация: `POST /invalidate-cache` с токеном.

### Аутентификация

- Cookie-based сессии (`session_id`, HTTPOnly, SameSite=Lax)
- Пароли: bcrypt (rounds=12)
- TTL сессии: 10 дней с sliding window (продление при каждом запросе)
- Роли: `admin`, `user`
- Dependencies FastAPI: `get_current_user`, `require_auth`, `require_admin`

### Подключение к БД

Два независимых пула соединений:
- **`db.py`** — основной (`DB_DSN`): ThreadedConnectionPool (min 1, max 10) + ThreadPoolExecutor (10 workers) для `run_in_executor`
- **`db_resources.py`** — ресурсы (`DB_DSN_RESOURCES`): аналогичная архитектура, отдельный пул

Каждый запрос: `get_conn()` (с retry 5s) → `RealDictCursor` → `commit`/`rollback` → `put_conn()`.

---

## Frontend (Vue 3)

### Маршрутизация

| Путь | View | `requiresAuth` | `requiresAdmin` | Описание |
|------|------|:---:|:---:|----------|
| `/` | `MonthlyDashboardView` | ✅ | — | Месячный дашборд (главная) |
| `/daily` | `DailyDashboardView` | ✅ | — | Дневной дашборд |
| `/smeta/:smetaKey` | `SmetaBreakdownView` | ✅ | — | Drill-down по смете |
| `/prices` | `PricesView` | ✅ | — | Расценки |
| `/road-sections` | `RoadSectionsView` | ✅ | — | Участки дорог |
| `/resources` | `ResourcesView` | ✅ | — | Техника и люди |
| `/mileage` | `MileageView` | ✅ | — | Пробег |
| `/fuel` | `FuelView` | ✅ | — | Топливо |
| `/users` | `UsersView` | ✅ | ✅ | Управление пользователями |
| `/login` | `LoginView` | — | — | Страница входа |

Все view — **lazy-loaded** через динамический `import()`. Auth guard в `beforeEach`: проверяет `requiresAuth` и `requiresAdmin`, обновляет `document.title`.

### State Management (Pinia)

11 хранилищ с однонаправленным потоком данных:

| Store | Описание | Данные |
|-------|----------|--------|
| `dashboardUiStore` | Общий UI-стейт | `mode` (monthly/daily), `selectedMonth` |
| `monthlyStore` | Месячный дашборд | KPI, контракт, доступные месяцы, lastLoadedAt |
| `dailyStore` | Дневной дашборд | Работы за день, доступные даты |
| `smetaStore` | Сметы | Карточки, детализация, description drill-down |
| `authStore` | Аутентификация | user, isAuthenticated, isAdmin, CRUD users |
| `pricesStore` | Расценки | rows, searchQuery, фильтры (debounced) |
| `roadSectionsStore` | Участки дорог | rows, searchQuery (debounced) |
| `resourcesStore` | Ресурсы | Справочники, CRUD смен, сводка |
| `mileageStore` | Пробег | byDate, byVehicle, переключение подразделов |
| `fuelStore` | Топливо | general, byDriver, drivers |
| `helpers` | Утилиты | Нормализация, SMETA_LABELS, fallbackMonths |

### API-клиент

Файл `src/api/client.ts`:
- Базовый URL: `VITE_API_BASE` (fallback: `https://api.podolsk.mad.moclean.ru`)
- Все пути: `/api/v1/*`
- Retry: 3 попытки с экспоненциальной задержкой для 5xx
- `AbortSignal` для отмены запросов
- `ApiError` класс с `status`, `url`

7 модулей API-клиента (`src/api/`) зеркалят 7 роутеров бэкенда.

### Компоненты

```
components/
├── ui/           # Дизайн-система: UiBadge, UiButton, UiCard, UiInput, UiLabel,
│                 #   UiProgress, UiSkeleton, UiSpinner, UiStack, UiText, tokens.ts
├── common/       # EmptyState, ErrorBoundary, Icons, LastUpdatedBadge, NavMenu,
│                 #   TableSkeleton, ToastContainer
├── layouts/      # AppHeader, CardsGrid, PageSection
├── dashboard/    # ContractExecutionSection, SummaryKpiSection, SmetaCardsSection,
│                 #   SmetaDetails, DailyTable, модальные окна (Revenue, Description, TypeOfWork)
├── pickers/      # CalendarDropdown, DayPicker, MonthPicker, TimePicker
├── resources/    # EquipmentForm, MasterForm, ShiftSearchForm, SummaryTables, DeleteReasonModal
├── fuel/         # FuelGeneralTable, FuelByDriverTable, фильтры
└── mileage/      # MileageByDateTable, MileageByVehicleTable, фильтры
```

### Composables

| Composable | Назначение |
|------------|------------|
| `useQueryClient` | Мини-TanStack Query: кэширование, staleTime (5 мин), retry, refetchOnWindowFocus, keepPreviousData |
| `useAsyncData` | Загрузчик с AbortController, loading/error стейтом |
| `useDebouncedSearch` | Debounced ref → fetchFn (min 3 символа) |
| `useSort` | Сортировка таблиц: sortKey, sortDir, toggleSort() |
| `useSmetaBreakdown` | Фильтрация/агрегация строк сметы, расчёт totals |
| `useCalendar` | 42-дневная сетка, навигация, min/max даты |
| `useModal` | isOpen, open(), close(), lockScroll, closeOnEsc |
| `usePreferredTheme` | Синхронизация light/dark с prefers-color-scheme + localStorage |
| `useIsMobile` | matchMedia('max-width: 767px') → Ref\<boolean\> |
| `useToast` | Toast-уведомления: success/error/warning/info |
| `useErrorHandler` | HTTP-коды → понятные сообщения + toast |
| `useBodyClass` | Добавление/удаление CSS-класса на \<body\> |
| `useTitleExpansion` | Определение обрезки текста (line-clamp), toggle |

### Стили и дизайн-система

Архитектура CSS Layers: `tokens → foundations → components → utilities → overrides`

| Файл | Описание |
|------|----------|
| `_tokens.scss` | CSS custom properties: цвета, шрифты (Manrope), surface/overlay. Поддержка **dark theme** через `[data-theme="dark"]` |
| `_foundations.scss` | Breakpoints ($bp-sm/md/lg/xl), миксины (page-container, fluid-type), px-to-rem() |
| `_fonts.scss` | @font-face для Manrope (woff2) |
| `main.scss` | Входная точка: @use всех модулей |
| `modules/` | _typography, _layout-grid, _utilities, _tables-modals, _buttons-pills, _cards, _summary, _pickers, _daily-table и т.д. |

### Типизация

- `src/types/dashboard.d.ts` — Frontend-адаптированные типы (MonthlySummary, SmetaCard, DailyRow, QueryOptions...)
- `src/types/api.generated.d.ts` — **Авто-генерация** из Pydantic-схем бэкенда (скрипт `scripts/generate-api-types.py`). Все поля `readonly`.

Генерация: `npm run generate:api-types` (или `python3 scripts/generate-api-types.py`)

---

## База данных (PostgreSQL)

### Схемы

- **`public`** — основная: dimension-таблицы (`dim_*`), fact-таблицы (`fact_*`), materialized views (`mv_*`), таблицы пользователей (`users`, `sessions`), ETL-метаданные (`etl_load_state`)
- **`initial_data`** — исходные данные: `fact_vehicle_mileage`, другие факт-таблицы для ETL

### Materialized Views (11 шт.)

Цепочка зависимостей (от нижних к верхним):

```
mv_work_actual_daily_value          ← базовые факты работ по дням
mv_work_plan_monthly_value          ← плановые значения по месяцам
mv_work_actual_daily_value_rows     ← детализированные строки фактов
mv_work_plan_vs_actual_monthly_value ← план vs факт (FULL OUTER JOIN)
mv_work_plan_actual_monthly_summary ← агрегированная сводка (KPI)
mv_excess_road_km_1km               ← превышение норм (км)
mv_excess_road_area_10000m2         ← превышение норм (площадь дорог)
mv_excess_sidewalk_area_1000m2      ← превышение норм (тротуары)
mv_excess_monthly_by_work           ← превышения по работам
mv_excess_rotor                     ← роторная техника
mv_vehicle_expected_fuel_daily      ← ожидаемый расход топлива (пробег × норма)
```

### Ключевые таблицы

| Таблица | Описание |
|---------|----------|
| `dim_vehicles` | Справочник машин (plate_number, тип) |
| `dim_vehicles_types` | Типы техники (fuel_consumption_per_100km) |
| `dim_employee` | Сотрудники (водители, мастера) |
| `dim_road_section` | Участки дорог (длина, ширина, объёмы) |
| `dim_daily_gas_limit` | Лимиты топлива по картам |
| `fact_equipment_shifts` | Смены техники (soft delete, audit) |
| `fact_master_shifts` | Смены мастеров |
| `fact_daily_card_fuel` | Факт расхода топлива по картам |
| `fact_vehicle_mileage` | Факт пробега (initial_data схема) |
| `fact_price_2026_upto_may` | Расценки на работы |
| `fact_resources_change_log` | Аудит-лог изменений (JSONB) |
| `contract_amount_2025` / `_2026_h1` | Суммы контрактов по периодам |
| `etl_load_state` | Метаданные ETL (loaded_at) |
| `users` / `sessions` | Пользователи и сессии |

---

## Скрипты

### `scripts/` — работа с БД

| Скрипт | Описание |
|--------|----------|
| `apply_mviews_chain.sh` | Пересоздание MV в правильном порядке зависимостей (git pull → DROP + CREATE каждой MV → REFRESH) |
| `export_mviews.sh` | Экспорт DDL всех MV из PostgreSQL в `app/db/mviews/` (git commit + push) |
| `export_schema.sh` | Экспорт полных DDL-схем (public, initial_data) в `app/db/schema/full/` |
| `sync_mviews.sh` | Полный цикл: git pull → export schema → export MV → apply chain → git commit |

### `frontend/scripts/`

| Скрипт | Описание |
|--------|----------|
| `generate-api-types.py` | Генерация TypeScript типов из Pydantic-схем бэкенда |
| `check-tokens.cjs` | Проверка использования SCSS дизайн-токенов |

---

## Деплой (Coolify)

Оба сервиса деплоятся через [Coolify](https://coolify.io) на VPS. Coolify автоматически: собирает Docker-образы при пуше в `main`, выкатывает на VPS, настраивает SSL через Let's Encrypt.

### Backend

- **Dockerfile:** `Dockerfile` (корень)
- **Образ:** Python 3.12-slim → pip install → Uvicorn на :8000

### Frontend

- **Dockerfile:** `frontend/Dockerfile`
- **Multi-stage:** Node 20 Alpine (build: vue-tsc + vite) → Nginx Alpine (serve: SPA fallback `try_files`)
- **Build-arg:** `VITE_API_BASE`

---

## Локальная разработка

### Требования
- Python 3.12+
- Node.js 20+
- PostgreSQL (или доступ к удалённой БД)

### Backend

```bash
cd app/backend

# Виртуальное окружение
python -m venv .venv
source .venv/bin/activate

# Зависимости
pip install -r ../../requirements.txt

# Переменные окружения
export DB_DSN="postgresql://USER:PASSWORD@HOST:5432/DBNAME"

# Запуск (из корня репо!)
cd ../..
uvicorn app.backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Зависимости
npm ci

# Dev-сервер (проксирует /api → бэкенд)
npm run dev

# Проверки
npm run type-check          # TypeScript
npm run lint:css            # Stylelint
npm run build:analyze       # Bundle analysis
npm run generate:api-types  # Обновить TS типы из Pydantic
```

---

## Переменные окружения

### Backend

| Переменная | Обязательна | Описание |
|------------|:-----------:|----------|
| `DB_DSN` | ✅ | PostgreSQL connection string (основная БД) |
| `DB_DSN_RESOURCES` | — | PostgreSQL connection string (БД ресурсов, если отличается) |
| `CACHE_INVALIDATION_TOKEN` | — | Токен для `POST /invalidate-cache` |
| `ALLOWED_ORIGINS` | — | CORS origins через запятую (default: `*`) |
| `DB_POOL_MIN` / `DB_POOL_MAX` | — | Размер пула соединений (default: 1/10) |
| `DB_EXECUTOR_WORKERS` | — | Воркеры ThreadPoolExecutor (default: 10) |
| `DB_RESOURCES_POOL_MIN` / `MAX` | — | Пул для db_resources |
| `DB_RESOURCES_EXECUTOR_WORKERS` | — | Воркеры для db_resources |

### Frontend (Build-time)

| Переменная | Описание |
|------------|----------|
| `VITE_API_BASE` | URL бэкенда (например `https://api.podolsk.mad.moclean.ru`) |

---

## Документация

| Документ | Описание |
|----------|----------|
| [app/backend/README.md](app/backend/README.md) | Документация Backend API с примерами эндпоинтов |
| [docs/frontend-spec.md](docs/frontend-spec.md) | Полная спецификация фронтенда (экраны, компоненты, API-контракты) |
| [docs/бизнес логика дашборда.md](docs/%D0%B1%D0%B8%D0%B7%D0%BD%D0%B5%D1%81%20%D0%BB%D0%BE%D0%B3%D0%B8%D0%BA%D0%B0%20%D0%B4%D0%B0%D1%88%D0%B1%D0%BE%D1%80%D0%B4%D0%B0.md) | Формулы KPI, бизнес-логика расчётов |
| [docs/Расшифровка по типу работы.md](docs/%D0%A0%D0%B0%D1%81%D1%88%D0%B8%D1%84%D1%80%D0%BE%D0%B2%D0%BA%D0%B0%20%D0%BF%D0%BE%20%D1%82%D0%B8%D0%BF%D1%83%20%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D1%8B.md) | Расшифровка типов работ |
| [frontend/README.md](frontend/README.md) | README фронтенда |

# SKPDI Dashboard

Веб-приложение для мониторинга выполнения работ по контракту СКПДИ (содержание дорог).

## 🏗️ Архитектура

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│   PostgreSQL    │
│   Vue 3 + Vite  │     │     FastAPI     │     │                 │
│    (Coolify)    │     │    (Coolify)    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 📦 Стек технологий

### Frontend
- **Vue 3** — Composition API, `<script setup>`
- **Vite** — сборка и dev-сервер
- **Pinia** — state management
- **Vue Router** — маршрутизация (SPA)
- **TypeScript** — типизация
- **SCSS** — стилизация с дизайн-токенами
- **UnoCSS** — utility-first CSS

### Backend
- **FastAPI** — REST API
- **Uvicorn** — ASGI-сервер
- **psycopg2** — PostgreSQL драйвер
- **Pydantic** — валидация данных

### База данных
- **PostgreSQL** — хранение данных
- Materialized Views для агрегации

## 🚀 Деплой (Coolify на VPS)

Оба сервиса деплоятся через [Coolify](https://coolify.io) на VPS.

### Backend
1. Подключить репозиторий в Coolify
2. Указать путь к Dockerfile: `Dockerfile` (в корне)
3. Задать переменные окружения:

| Переменная | Описание |
|------------|----------|
| `DB_DSN` | PostgreSQL connection string |
| `CACHE_INVALIDATION_TOKEN` | Токен для инвалидации кэша |
| `ALLOWED_ORIGINS` | CORS origins (через запятую) |

### Frontend
1. Подключить репозиторий в Coolify
2. Указать путь к Dockerfile: `frontend/Dockerfile`
3. Задать переменные окружения сборки (Build Arguments):

| Переменная | Описание |
|------------|----------|
| `VITE_API_BASE` | URL бэкенда (например `https://api.podolsk.mad.moclean.ru`) |

Coolify автоматически:
- Собирает Docker-образы при пуше в main
- Выкатывает на VPS
- Настраивает SSL через Let's Encrypt

## 🛠️ Локальная разработка

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

# Запуск
uvicorn app.backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Зависимости
npm ci

# Для работы с локальным бэкендом
export VITE_API_BASE="http://localhost:8000"

# Запуск dev-сервера
npm run dev
```

## 📡 API

**Версия:** v1  
**Базовый путь:** `/api/v1/dashboard`

### Endpoints

| Endpoint | Описание |
|----------|----------|
| `GET /monthly/summary?month=YYYY-MM` | Сводка по контракту и KPI |
| `GET /monthly/by-smeta?month=YYYY-MM` | Карточки смет |
| `GET /monthly/daily-revenue?month=YYYY-MM` | Выручка по дням |
| `GET /monthly/smeta-details?month=YYYY-MM&smeta_key=KEY` | Детализация сметы |
| `GET /daily?date=YYYY-MM-DD` | Дневной отчёт |
| `GET /months?limit=N` | Доступные месяцы |
| `GET /last-loaded` | Время последней загрузки данных |
| `GET /api/health` | Health check с проверкой БД |

Полная документация API: [app/backend/README.md](app/backend/README.md)

## 📁 Структура проекта

```
├── app/backend/           # FastAPI бэкенд
│   ├── main.py            # Точка входа
│   ├── db.py              # Подключение к БД
│   ├── routers/           # API роуты
│   ├── services/          # Бизнес-логика
│   ├── repositories/      # Работа с данными
│   └── schemas/           # Pydantic модели
├── frontend/              # Vue 3 фронтенд
│   ├── src/
│   │   ├── views/         # Страницы (Daily, Monthly, Smeta)
│   │   ├── components/    # UI компоненты
│   │   ├── store/         # Pinia stores
│   │   ├── api/           # API клиент
│   │   ├── composables/   # Vue composables
│   │   └── styles/        # SCSS + токены
│   └── Dockerfile         # Сборка для Coolify
├── docs/                  # Документация
├── Dockerfile             # Backend Docker
└── requirements.txt       # Python зависимости
```

## 📊 Функционал дашборда

- **Месячный дашборд** — KPI по контракту, карточки смет, прогресс выполнения
- **Дневной дашборд** — детализация работ за день
- **Детализация сметы** — breakdown по работам с типами

## 📝 Документация

- [Backend API](app/backend/README.md)
- [Frontend](frontend/README.md)
- [Бизнес-логика дашборда](docs/бизнес%20логика%20дашборда.md)
- [Структура БД](docs/Postgres%20DB.md)

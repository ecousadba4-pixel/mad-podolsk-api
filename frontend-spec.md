# Frontend Spec — Дашборд MAD Podolsk (Vue)

Этот документ описывает фронтенд-часть дашборда: экраны, компоненты, состояние, API-контракты и бизнес-поведение.
Источник бизнес-логики и расчётов: `бизнес логика дашборда.md` - описание формул показателей
Описание таблиц/представлений Postgres в файл 'Postgres DB.md'.

## 1. Общая идея

Веб-дашборд для мониторинга показателей по выполнению работ:

- Две основных секции:
  - **По месяцам** — агрегированные показатели, графики и детализация по сметам и видам работ сгруппированные по месяцам.
  - **По дням** — детализированная таблица по конкретной дате.
- Данные берутся из Postgres через API-слой (Python-бэкенд).
- Фронтенд: **Vue 3 + Vite**, **Pinia** для состояния, **Vue Router**.

## 2. Глобальные фильтры и режимы

Фронтенд должен уметь держать следующее состояние:

- **Режим отображения**:
  - `mode = "monthly" | "daily"`
- **Выбранный месяц** (для режима «По месяцам»):
  - `selectedMonth: YYYY-MM` (например, `"2025-05"`)
- **Выбранная дата** (для режима «По дням»):
  - `selectedDate: YYYY-MM-DD`
- **Выбранная смета** (для раздела «Работы в разрезе Смет» и связанных расшифровок работ):
  - `selectedSmeta: "leto" | "zima" | "vnereglement"`  
    (отображаемые названия: Лето, Зима, Внерегламент)
- **Выбранный вид работ (`description`)** для модальных окон расшифровки:
  - `selectedDescription: string | null`

Все эти фильтры хранятся в **Pinia-store** и используются в API-запросах.

## 3. API-контракты 

### 3.1. Общие принципы

- Все даты — в ISO-формате (`YYYY-MM-DD`).
- Для месячных запросов используется `month` в формате `YYYY-MM`.
- Все суммы в деньгах возвращаются в целых числах.
- Все проценты возвращаются как доли (например `0.43` для 43%) — форматирование в проценты делает фронтенд.

Ниже — логический контракт. Фактические URL можно скорректировать при реализации бэкенда.

### 3.2. Модуль «По месяцам» — общие KPI и исполнение контракта

**GET `/api/dashboard/monthly/summary`**

Параметры:
- `month` — `YYYY-MM` (обязательный)

Ответ:
```jsonc
{
  "month": "2025-05",

  // Раздел "Исполнение контракта"
  "contract": {
    "summa_contract": 10000000,          // summa_contract
    "fact_total": 6500000,               // fact_total
    "contract_planfact_pct": 0.65        // fact_total / summa_contract
  },

  // Раздел summary KPI
  "kpi": {
    "plan_total": 7000000,               // plan_total
    "fact_total": 6500000,               // fact_total
    "delta": -500000,                    // fact_total - plan_total
    "avg_daily_revenue": 250000          // ср. днев. выручка (по формуле)
  }
}

### 3.3. Модальное окно «Выручка по дням» (Секция По месяцу)

**GET /api/dashboard/monthly/daily-revenue**

Параметры:
- `month` — `YYYY-MM` (обязательный)

Ответ:
```jsonc
{
  "month": "2025-05",
  "rows": [
    {
      "date": "2025-05-01",   // date_done
      "amount": 200000        // Сумма total_amount по date_done, где status = "Рассмотрено"
    },
    {
      "date": "2025-05-02",
      "amount": 180000
    }
  ]
}

### 3.4. Раздел «Работы в разрезе Смет» (карточки)

**GET /api/dashboard/monthly/by-smeta**

Параметры:
- `month` — `YYYY-MM` (обязательный)

Ответ:
```jsonc
{
  "month": "2025-05",
  "cards": [
    {
      "smeta_key": "leto",            // внутренний ключ
      "label": "Лето",                // отображаемое название
      "plan": 3000000,                // plan_leto
      "fact": 2800000,                // fact_leto
      "delta": -200000                // fact_leto - plan_leto
    },
    {
      "smeta_key": "zima",
      "label": "Зима",
      "plan": 2500000,                // plan_zima
      "fact": 2400000,                // fact_zima
      "delta": -100000
    },
    {
      "smeta_key": "vnereglement",
      "label": "Внерегламент",
      "plan": 1500000,                // plan_vnereglament
      "fact": 1300000,                // fact_vnereglament
      "delta": -200000
    }
  ]
}

Соответствие smeta_key ↔ smeta_code:
"leto" → smeta_code = "Лето"
"zima" → smeta_code = "Зима"
"vnereglement" → smeta_code IN ("Внерегламент ч.1", "Внерегламент ч.2")

### 3.5. Раздел «Расшифровка работ по смете» (таблица по видам работ)

**GET /api/dashboard/monthly/smeta-details**

Параметры:
month — YYYY-MM (обязательный)
smeta_key — "leto" | "zima" | "vnereglement"

Ответ:
```jsonc
{
  "month": "2025-05",
  "smeta_key": "leto",
  "rows": [
    {
      "description": "Вывоз ТКО",
      "plan": 500000,              // сумма planned_amount по description и смете (0 для vnereglement)
      "fact": 480000,              // сумма fact_amount_done
      "delta": -20000              // fact - plan
    }
  ]
}

### 3.6. Модальное окно «Расшифровка работ по дням» (по description)

**GET /api/dashboard/monthly/smeta-description-daily**

Параметры:
month — YYYY-MM (обязательный)
smeta_key — "leto" | "zima" | "vnereglement"
description — строка

Ответ:
```jsonc
{
  "month": "2025-05",
  "smeta_key": "leto",
  "description": "Вывоз ТКО",
  "rows": [
    {
      "date": "2025-05-01",       // date_done
      "volume": 120,              // сумма total_volume по date_done (где status = "Рассмотрено")
      "unit": "м³",               // первое значение unit
      "amount": 60000             // сумма total_amount по date_done (status = "Рассмотрено")
    }
  ]
}

Отображение во фронтенде:
Колонка «Объём»: volume + (unit)

### 3.7. Секция «По дням» (главный режим)

**GET /api/dashboard/daily**

Параметры:
date — YYYY-MM-DD (обязательный)

Ответ:
```jsonc
{
  "date": "2025-05-01",
  "rows": [
    {
      "description": "Вывоз ТКО",  // агрегированный description
      "unit": "м³",                // первое значение unit для description
      "volume": 120,               // сумма total_volume (status = "Рассмотрено")
      "amount": 60000              // сумма total_amount
    }
  ],
  "total": {
    "amount": 200000               // Итого по сумме
  }
}

## 4. Компонентная структура
### 4.1. Верхний уровень

App.vue
Общий layout (хедер, контейнер, светлая тема)
Включает компонент выбора режима секций дашборда: ModeSwitch (По месяцам / По дням)

Рендерит:
<MonthlyDashboard v-if="mode === 'monthly'"/>
<DailyDashboard v-else />

### 4.2. Режим «По месяцам»

Контейнер:
views/MonthlyDashboard.vue

Компоненты:
MonthSelector — выбор месяца
pill "Данные обновлены" - отображает плашку с указанием даты и времени последнего обновления данных в БД столбец loaded_at в таблице skpdi_fact_agg 
Кнопка PDF - выгружает в файл pdf структурированный табличный отчет
ContractExecutionSection
SummaryKpiSection
SmetaCardsSection
SmetaDetailsTable

Модальные окна:
DailyRevenueModal
SmetaDescriptionDailyModal

Примерная разбивка:

components/filters/MonthSelector.vue
Биндит selectedMonth в Pinia.
При изменении вызывает загрузку месячных данных.

components/sections/ContractExecutionSection.vue
Принимает проп contract (summa_contract, fact_total, contract_planfact_pct).
Отображает три карточки:
Контракт
Выполнено
Исполнение (проценты).

components/sections/SummaryKpiSection.vue
Принимает kpi (plan_total, fact_total, delta, avg_daily_revenue).
Отдельные карточки + нажатие на карточку Среднедневная выручка → открывает DailyRevenueModal.

components/sections/SmetaCardsSection.vue
Рендерит три карточки: Лето, Зима, Внерегламент.
В них отображаются показатели - План/Факт/Отклонение
При клике устанавливает selectedSmeta в Pinia и инициирует загрузку данных для SmetaDetailsTable.

components/tables/SmetaDetailsTable.vue
Получает список rows для выбранной сметы.

Колонки: Работы, План, Факт, Отклонение.
Клик по строке → устанавливает selectedDescription и открывает SmetaDescriptionDailyModal. Действует только если выбран текущий календарный месяц.

components/modals/DailyRevenueModal.vue
Использует данные /api/dashboard/monthly/daily-revenue.
Таблица: Дата, Сумма.
DailyRevenueModal Действует только если выбран текущий календарный месяц.

components/modals/SmetaDescriptionDailyModal.vue
Использует данные /api/dashboard/monthly/smeta-description-daily.
Таблица: Дата, Объём (unit), Сумма.

### 4.3. Режим «По дням»

Контейнер:
views/DailyDashboard.vue

Компоненты:
DateSelector — выбор даты
pill "Данные обновлены" - отображает плашку с указанием даты и времени последнего обновления данных в БД столбец loaded_at в таблице skpdi_fact_agg 
DailyTable

components/filters/DateSelector.vue
Управляет selectedDate в Pinia.
При изменении вызывает загрузку /api/dashboard/daily.

components/tables/DailyTable.vue
Колонки:
Работы (description)
Единица измерения (unit)
Объём (volume (unit))
Сумма (amount)
Внизу строка «Итого» по столбцу «Сумма».

## 5. Создание фронтенда на Vue

Scaffold проекта
npm create vite@latest → шаблон Vue.
Настрой: структуру папок src/components, src/views, src/store, src/api.

Базовый каркас интерфейса
Сделай layout: шапка, основной контент, фон, контейнеры под виджеты.
Подключи глобальные стили (CSS/SCSS).

Подключи API
Создай src/api/client.ts для универсального fetch/axios с базовым URL.
Напиши функции getMonthlyDashboard() и getDailyDashboard().

Основные компоненты Vue
DashboardView.vue — главная страница.

Компоненты:
SummaryCards.vue (общие показатели);
DailyDetailsModal.vue;
FiltersBar.vue.

Навигация и состояния
Состояние загрузки (isLoading), ошибок, пустых данных.
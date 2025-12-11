# Материализованные представления для новой модели данных

Ниже — минимальный набор матпредставлений, который опирается на новые факт/словарные таблицы и закрывает потребности текущего backend-кода. Во всех запросах используются `id_`-колонки, чтобы ускорить join'ы и агрегации. Порядок пересборки: `mv_fact_daily_amounts` → `mv_plan_vs_fact_monthly_ids` → `mv_plan_fact_monthly_backend_ids`.

## 1. mv_fact_daily_amounts
Агрегирует сырой отчёт `skpdi_report_raw` в деньги и объёмы по дням и работам.

```sql
CREATE MATERIALIZED VIEW mv_fact_daily_amounts AS
SELECT
    d.date                               AS date_done,
    date_trunc('month', d.date)::date    AS month_start,
    sr.id_status,
    st.status,
    wd.id_description,
    wd.description,
    wd.id_unit,
    u.unit,
    wd.id_smeta,
    ts.smeta_code,
    wd.id_smeta_section,
    ss.smeta_section,
    wd.id_type_of_work,
    tw.type_work AS type_of_work,
    COALESCE(SUM(sr.volume_done), 0)                 AS total_volume,
    COALESCE(SUM(sr.volume_done * p.price), 0)       AS total_amount
FROM skpdi_report_raw sr
JOIN dates_table d ON d.date = sr.date_of_work
JOIN work_description wd ON wd.id_description = sr.id_description
JOIN type_of_smeta ts ON ts.id_smeta = wd.id_smeta
JOIN smeta_section ss ON ss.id_smeta_section = wd.id_smeta_section
LEFT JOIN prices_2025 p ON p.id_description = sr.id_description
    AND p.id_smeta = wd.id_smeta
    AND p.id_smeta_section = wd.id_smeta_section
LEFT JOIN unit_list u ON u.id_unit = wd.id_unit
LEFT JOIN type_of_work tw ON tw.id_type_of_work = wd.id_type_of_work
LEFT JOIN status_of_work st ON st.id_status = sr.id_status
GROUP BY
    d.date,
    sr.id_status,
    st.status,
    wd.id_description,
    wd.description,
    wd.id_unit,
    u.unit,
    wd.id_smeta,
    ts.smeta_code,
    wd.id_smeta_section,
    ss.smeta_section,
    wd.id_type_of_work,
    tw.type_work;
```

## 2. mv_plan_vs_fact_monthly_ids
Объединяет план из `mv_ruad_plan` и факт из `mv_fact_daily_amounts` по месяцам/работам.

```sql
CREATE MATERIALIZED VIEW mv_plan_vs_fact_monthly_ids AS
WITH plan AS (
    SELECT
        date_trunc('month', month_start)::date AS month_start,
        rp.id_description,
        rp.id_smeta,
        COALESCE(SUM(rp.planned_amount), 0) AS planned_amount
    FROM mv_ruad_plan rp
    GROUP BY 1, 2, 3
),
fact AS (
    SELECT
        month_start,
        id_description,
        id_smeta,
        COALESCE(SUM(total_amount), 0) AS fact_amount_done
    FROM mv_fact_daily_amounts
    WHERE status = 'Рассмотрено'
    GROUP BY 1, 2, 3
)
SELECT
    COALESCE(p.month_start, f.month_start)              AS month_start,
    wd.id_description,
    wd.description,
    wd.id_smeta,
    ts.smeta_code,
    wd.id_type_of_work,
    tw.type_work                                         AS type_of_work,
    COALESCE(p.planned_amount, 0)                        AS planned_amount,
    COALESCE(f.fact_amount_done, 0)                      AS fact_amount_done
FROM plan p
FULL JOIN fact f
    ON p.month_start = f.month_start
   AND p.id_description = f.id_description
   AND p.id_smeta = f.id_smeta
JOIN work_description wd ON wd.id_description = COALESCE(p.id_description, f.id_description)
JOIN type_of_smeta ts ON ts.id_smeta = wd.id_smeta
LEFT JOIN type_of_work tw ON tw.id_type_of_work = wd.id_type_of_work;
```

## 3. mv_plan_fact_monthly_backend_ids
Предагрегированные значения плана/факта по ключевым сметам для карточек и сводки.

```sql
CREATE MATERIALIZED VIEW mv_plan_fact_monthly_backend_ids AS
WITH base AS (
    SELECT
        to_char(month_start, 'YYYY-MM') AS month_key,
        smeta_code,
        COALESCE(SUM(planned_amount), 0)    AS planned_amount,
        COALESCE(SUM(fact_amount_done), 0)  AS fact_amount
    FROM mv_plan_vs_fact_monthly_ids
    GROUP BY 1, 2
)
SELECT
    month_key,
    SUM(planned_amount) FILTER (WHERE smeta_code = 'Лето')            AS plan_leto,
    SUM(planned_amount) FILTER (WHERE smeta_code = 'Зима')            AS plan_zima,
    ROUND((COALESCE(SUM(planned_amount) FILTER (WHERE smeta_code = 'Лето'), 0) +
           COALESCE(SUM(planned_amount) FILTER (WHERE smeta_code = 'Зима'), 0)) * 0.43) AS plan_vnereglament,
    (COALESCE(SUM(planned_amount) FILTER (WHERE smeta_code = 'Лето'), 0) +
     COALESCE(SUM(planned_amount) FILTER (WHERE smeta_code = 'Зима'), 0) +
     ROUND((COALESCE(SUM(planned_amount) FILTER (WHERE smeta_code = 'Лето'), 0) +
            COALESCE(SUM(planned_amount) FILTER (WHERE smeta_code = 'Зима'), 0)) * 0.43)) AS plan_total,
    SUM(fact_amount)   FILTER (WHERE smeta_code = 'Лето')             AS fact_leto,
    SUM(fact_amount)   FILTER (WHERE smeta_code = 'Зима')             AS fact_zima,
    SUM(fact_amount)   FILTER (WHERE smeta_code IN ('Внерегламент ч.1','Внерегламент ч.2')) AS fact_vnereglament,
    SUM(fact_amount)                                                     AS fact_total
FROM base
GROUP BY month_key;
```

Эти три представления заменяют прежние `skpdi_fact_with_money`, `skpdi_plan_vs_fact_monthly` и `skpdi_plan_fact_monthly_backend`. Код backend уже перенастроен на новые имена и `id_`-поля.

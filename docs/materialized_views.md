# Материализованные представления для новой модели данных

Ниже — минимальный набор матпредставлений, который опирается на новые факт/словарные таблицы и закрывает потребности текущего backend-кода. Во всех запросах используются `id_`-колонки, чтобы ускорить join'ы и агрегации. Порядок пересборки: `mv_fact_daily_amounts` → `mv_plan_vs_fact_monthly_ids` → `mv_plan_fact_monthly_backend_ids`.

## 1. mv_fact_daily_amounts
Агрегирует сырой отчёт `skpdi_report_raw` и `fact_pik_amount` в деньги и объёмы по дням и работам.

```sql
CREATE MATERIALIZED VIEW mv_fact_daily_amounts AS
WITH pik_months AS (
         SELECT DISTINCT date_trunc('month'::text, fact_pik_amount.date_of_work::timestamp with time zone)::date AS month_start
           FROM fact_pik_amount
        ), skpdi AS (
         SELECT d.date AS date_done,
            date_trunc('month'::text, d.date::timestamp with time zone)::date AS month_start,
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
            COALESCE(sum(sr.volume_done), 0::numeric) AS total_volume,
            COALESCE(sum(sr.volume_done * p.price), 0::numeric) AS total_amount
           FROM skpdi_report_raw sr
             JOIN dates_table d ON d.date = sr.date_of_work
             JOIN work_description wd ON wd.id_description = sr.id_description
             JOIN type_of_smeta ts ON ts.id_smeta = wd.id_smeta
             JOIN smeta_section ss ON ss.id_smeta_section = wd.id_smeta_section
             LEFT JOIN prices_2025 p ON p.id_description = sr.id_description AND p.id_smeta = wd.id_smeta AND p.id_smeta_section = wd.id_smeta_section
             LEFT JOIN unit_list u ON u.id_unit = wd.id_unit
             LEFT JOIN type_of_work tw ON tw.id_type_of_work = wd.id_type_of_work
             LEFT JOIN status_of_work st ON st.id_status = sr.id_status
          WHERE NOT (EXISTS ( SELECT 1
                   FROM pik_months pm
                  WHERE pm.month_start = date_trunc('month'::text, d.date::timestamp with time zone)::date))
          GROUP BY d.date, sr.id_status, st.status, wd.id_description, wd.description, wd.id_unit, u.unit, wd.id_smeta, ts.smeta_code, wd.id_smeta_section, ss.smeta_section, wd.id_type_of_work, tw.type_work
        ), pik AS (
         SELECT f.date_of_work AS date_done,
            date_trunc('month'::text, f.date_of_work::timestamp with time zone)::date AS month_start,
            3::bigint AS id_status,
            'Рассмотрено'::text AS status,
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
            COALESCE(sum(f.volume_done), 0::numeric) AS total_volume,
            COALESCE(sum(f.volume_done * p.price), 0::numeric) AS total_amount
           FROM fact_pik_amount f
             JOIN work_description wd ON wd.description = f.description
             JOIN type_of_smeta ts ON ts.id_smeta = wd.id_smeta
             JOIN smeta_section ss ON ss.id_smeta_section = wd.id_smeta_section
             LEFT JOIN prices_2025 p ON p.id_description = wd.id_description AND p.id_smeta = wd.id_smeta AND p.id_smeta_section = wd.id_smeta_section
             LEFT JOIN unit_list u ON u.id_unit = wd.id_unit
             LEFT JOIN type_of_work tw ON tw.id_type_of_work = wd.id_type_of_work
          GROUP BY f.date_of_work, wd.id_description, wd.description, wd.id_unit, u.unit, wd.id_smeta, ts.smeta_code, wd.id_smeta_section, ss.smeta_section, wd.id_type_of_work, tw.type_work
        )
 SELECT skpdi.date_done,
    skpdi.month_start,
    skpdi.id_status,
    skpdi.status,
    skpdi.id_description,
    skpdi.description,
    skpdi.id_unit,
    skpdi.unit,
    skpdi.id_smeta,
    skpdi.smeta_code,
    skpdi.id_smeta_section,
    skpdi.smeta_section,
    skpdi.id_type_of_work,
    skpdi.type_of_work,
    skpdi.total_volume,
    skpdi.total_amount
   FROM skpdi
UNION ALL
 SELECT pik.date_done,
    pik.month_start,
    pik.id_status,
    pik.status,
    pik.id_description,
    pik.description,
    pik.id_unit,
    pik.unit,
    pik.id_smeta,
    pik.smeta_code,
    pik.id_smeta_section,
    pik.smeta_section,
    pik.id_type_of_work,
    pik.type_of_work,
    pik.total_volume,
    pik.total_amount
   FROM pik;
```

## 2. mv_plan_vs_fact_monthly_ids
Объединяет план из `mv_ruad_plan` и факт из `mv_fact_daily_amounts` по месяцам/работам.

```sql
CREATE MATERIALIZED VIEW mv_plan_vs_fact_monthly_ids AS
 WITH plan AS (
         SELECT date_trunc('month'::text, rp.month_start::timestamp with time zone)::date AS month_start,
            rp.id_description,
            rp.id_smeta,
            COALESCE(sum(rp.planned_amount), 0::numeric) AS planned_amount
           FROM mv_ruad_plan rp
          GROUP BY (date_trunc('month'::text, rp.month_start::timestamp with time zone)::date), rp.id_description, rp.id_smeta
        ), fact AS (
         SELECT mv_fact_daily_amounts.month_start,
            mv_fact_daily_amounts.id_description,
            mv_fact_daily_amounts.id_smeta,
            COALESCE(sum(mv_fact_daily_amounts.total_amount), 0::numeric) AS fact_amount_done
           FROM mv_fact_daily_amounts
          WHERE mv_fact_daily_amounts.status = 'Рассмотрено'::text
          GROUP BY mv_fact_daily_amounts.month_start, mv_fact_daily_amounts.id_description, mv_fact_daily_amounts.id_smeta
        )
 SELECT COALESCE(p.month_start, f.month_start) AS month_start,
    wd.id_description,
    wd.description,
    wd.id_smeta,
    ts.smeta_code,
    wd.id_type_of_work,
    tw.type_work AS type_of_work,
    COALESCE(p.planned_amount, 0::numeric) AS planned_amount,
    COALESCE(f.fact_amount_done, 0::numeric) AS fact_amount_done
   FROM plan p
     FULL JOIN fact f ON p.month_start = f.month_start AND p.id_description = f.id_description AND p.id_smeta = f.id_smeta
     JOIN work_description wd ON wd.id_description = COALESCE(p.id_description, f.id_description)
     JOIN type_of_smeta ts ON ts.id_smeta = wd.id_smeta
     LEFT JOIN type_of_work tw ON tw.id_type_of_work = wd.id_type_of_work;
```

## 3. mv_plan_fact_monthly_backend_ids
Предагрегированные значения плана/факта по ключевым сметам для карточек и сводки.

```sql
CREATE MATERIALIZED VIEW mv_plan_fact_monthly_backend_ids AS
 WITH base AS (
         SELECT to_char(mv_plan_vs_fact_monthly_ids.month_start::timestamp with time zone, 'YYYY-MM'::text) AS month_key,
            mv_plan_vs_fact_monthly_ids.smeta_code,
            COALESCE(sum(mv_plan_vs_fact_monthly_ids.planned_amount), 0::numeric) AS planned_amount,
            COALESCE(sum(mv_plan_vs_fact_monthly_ids.fact_amount_done), 0::numeric) AS fact_amount
           FROM mv_plan_vs_fact_monthly_ids
          GROUP BY (to_char(mv_plan_vs_fact_monthly_ids.month_start::timestamp with time zone, 'YYYY-MM'::text)), mv_plan_vs_fact_monthly_ids.smeta_code
        )
 SELECT month_key,
    sum(planned_amount) FILTER (WHERE smeta_code = 'Лето'::text) AS plan_leto,
    sum(planned_amount) FILTER (WHERE smeta_code = 'Зима'::text) AS plan_zima,
    round((COALESCE(sum(planned_amount) FILTER (WHERE smeta_code = 'Лето'::text), 0::numeric) + COALESCE(sum(planned_amount) FILTER (WHERE smeta_code = 'Зима'::text), 0::numeric)) * 0.43) AS plan_vnereglament,
    COALESCE(sum(planned_amount) FILTER (WHERE smeta_code = 'Лето'::text), 0::numeric) + COALESCE(sum(planned_amount) FILTER (WHERE smeta_code = 'Зима'::text), 0::numeric) + round((COALESCE(sum(planned_amount) FILTER (WHERE smeta_code = 'Лето'::text), 0::numeric) + COALESCE(sum(planned_amount) FILTER (WHERE smeta_code = 'Зима'::text), 0::numeric)) * 0.43) AS plan_total,
    sum(fact_amount) FILTER (WHERE smeta_code = 'Лето'::text) AS fact_leto,
    sum(fact_amount) FILTER (WHERE smeta_code = 'Зима'::text) AS fact_zima,
    sum(fact_amount) FILTER (WHERE smeta_code = ANY (ARRAY['Внерегламент ч.1'::text, 'Внерегламент ч.2'::text])) AS fact_vnereglament,
    sum(fact_amount) AS fact_total
   FROM base
  GROUP BY month_key;;
```

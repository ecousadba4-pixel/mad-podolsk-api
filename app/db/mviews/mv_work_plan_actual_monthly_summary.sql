-- schema: public
-- name: mv_work_plan_actual_monthly_summary

CREATE MATERIALIZED VIEW public.mv_work_plan_actual_monthly_summary AS
 WITH base AS (
         SELECT to_char(v.month_start_date::timestamp with time zone, 'YYYY-MM'::text) AS year_month_key,
            v.estimate_name,
            COALESCE(sum(v.planned_value), 0::numeric) AS planned_value,
            COALESCE(sum(v.actual_value), 0::numeric) AS actual_value
           FROM mv_work_plan_vs_actual_monthly_value v
          GROUP BY (to_char(v.month_start_date::timestamp with time zone, 'YYYY-MM'::text)), v.estimate_name
        )
 SELECT year_month_key,
    sum(planned_value) FILTER (WHERE estimate_name = 'Лето'::text) AS planned_value_summer,
    sum(planned_value) FILTER (WHERE estimate_name = 'Зима'::text) AS planned_value_winter,
    round((COALESCE(sum(planned_value) FILTER (WHERE estimate_name = 'Лето'::text), 0::numeric) + COALESCE(sum(planned_value) FILTER (WHERE estimate_name = 'Зима'::text), 0::numeric)) * 0.43) AS planned_value_vnereglament,
    COALESCE(sum(planned_value) FILTER (WHERE estimate_name = 'Лето'::text), 0::numeric) + COALESCE(sum(planned_value) FILTER (WHERE estimate_name = 'Зима'::text), 0::numeric) + round((COALESCE(sum(planned_value) FILTER (WHERE estimate_name = 'Лето'::text), 0::numeric) + COALESCE(sum(planned_value) FILTER (WHERE estimate_name = 'Зима'::text), 0::numeric)) * 0.43) AS planned_value_total,
    sum(actual_value) FILTER (WHERE estimate_name = 'Лето'::text) AS actual_value_summer,
    sum(actual_value) FILTER (WHERE estimate_name = 'Зима'::text) AS actual_value_winter,
    sum(actual_value) FILTER (WHERE estimate_name = ANY (ARRAY['Внерегламент ч.1'::text, 'Внерегламент ч.2'::text])) AS actual_value_vnereglament,
    sum(actual_value) AS actual_value_total
   FROM base
  GROUP BY year_month_key;;

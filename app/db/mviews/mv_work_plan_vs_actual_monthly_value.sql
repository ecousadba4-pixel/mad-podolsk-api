-- schema: public
-- name: mv_work_plan_vs_actual_monthly_value

CREATE MATERIALIZED VIEW public.mv_work_plan_vs_actual_monthly_value AS
 WITH plan AS (
         SELECT date_trunc('month'::text, rp.month_start_date::timestamp with time zone)::date AS month_start_date,
            rp.work_item_id,
            rp.estimate_id,
            COALESCE(sum(rp.planned_value), 0::numeric) AS planned_value
           FROM mv_work_plan_monthly_value rp
          GROUP BY (date_trunc('month'::text, rp.month_start_date::timestamp with time zone)::date), rp.work_item_id, rp.estimate_id
        ), fact AS (
         SELECT f1.month_start_date,
            f1.work_item_id,
            f1.estimate_id,
            COALESCE(sum(f1.actual_value), 0::numeric) AS actual_value
           FROM mv_work_actual_daily_value f1
          WHERE f1.work_status_name = 'Рассмотрено'::text
          GROUP BY f1.month_start_date, f1.work_item_id, f1.estimate_id
        )
 SELECT COALESCE(p.month_start_date, f.month_start_date) AS month_start_date,
    wi.work_item_id,
    wi.work_name,
    wi.estimate_id,
    de.estimate_name,
    wi.work_type_id,
    wt.work_type_name,
    COALESCE(p.planned_value, 0::numeric) AS planned_value,
    COALESCE(f.actual_value, 0::numeric) AS actual_value
   FROM plan p
     FULL JOIN fact f ON p.month_start_date = f.month_start_date AND p.work_item_id = f.work_item_id AND p.estimate_id = f.estimate_id
     JOIN dim_work_item wi ON wi.work_item_id = COALESCE(p.work_item_id, f.work_item_id)
     JOIN dim_estimate de ON de.estimate_id = wi.estimate_id
     LEFT JOIN dim_work_type wt ON wt.work_type_id = wi.work_type_id;;

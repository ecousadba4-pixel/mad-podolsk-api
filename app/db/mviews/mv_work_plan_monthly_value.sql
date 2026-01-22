-- schema: public
-- name: mv_work_plan_monthly_value

CREATE MATERIALIZED VIEW public.mv_work_plan_monthly_value AS
 SELECT spa.month_start_date,
    wd.work_item_id,
    p.estimate_id,
    spa.quantity_planned * p.unit_price AS planned_value
   FROM initial_data.fact_work_plan_monthly spa
     JOIN dim_work_item wd ON spa.work_name = wd.work_name
     JOIN initial_data.fact_price_2025 p ON p.work_item_id = wd.work_item_id;;

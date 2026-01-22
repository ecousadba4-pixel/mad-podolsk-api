-- schema: public
-- name: mv_work_actual_daily_value_rows

CREATE MATERIALIZED VIEW public.mv_work_actual_daily_value_rows AS
 SELECT r.plan_row_id AS plan_id,
    r.work_report_id AS done_work_id,
    r.work_date,
    r.close_time,
    r.work_status_id,
    r.road_section_id,
    r.work_item_id,
    r.quantity_done,
    r.comment_text,
        CASE
            WHEN fb.work_report_id IS NOT NULL THEN true
            ELSE false
        END AS done_by_subcontractor,
    r.quantity_done *
        CASE
            WHEN r.work_date <= '2025-12-31'::date THEN p25.unit_price
            WHEN r.work_date >= '2026-01-01'::date AND r.work_date <= '2026-05-31'::date THEN p26.unit_price
            ELSE NULL::numeric
        END AS actual_value
   FROM initial_data.fact_work_skpdi_report r
     LEFT JOIN initial_data.fact_price_2025 p25 ON p25.work_item_id = r.work_item_id
     LEFT JOIN initial_data.fact_price_2026_upto_may p26 ON p26.work_item_id = r.work_item_id
     LEFT JOIN initial_data.fact_work_by_subcontractor fb ON fb.work_report_id::numeric = r.work_report_id;;

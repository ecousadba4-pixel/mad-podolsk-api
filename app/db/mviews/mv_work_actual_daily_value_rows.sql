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
    r.employee_id,
    r.quantity_done,
    r.comment_text,
        CASE
            WHEN fb.work_report_id IS NOT NULL THEN true
            ELSE false
        END AS done_by_subcontractor,
    r.quantity_done * p.unit_price AS actual_value
   FROM initial_data.fact_work_skpdi_report r
     LEFT JOIN v_work_item_price_by_date p ON p.work_item_id = r.work_item_id AND r.work_date >= p.start_date AND r.work_date <= p.end_date
     LEFT JOIN initial_data.fact_work_by_subcontractor fb ON fb.work_report_id::numeric = r.work_report_id;;

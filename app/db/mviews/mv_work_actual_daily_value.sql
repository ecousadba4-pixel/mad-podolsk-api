-- schema: public
-- name: mv_work_actual_daily_value

CREATE MATERIALIZED VIEW public.mv_work_actual_daily_value AS
 WITH pik_months AS (
         SELECT DISTINCT date_trunc('month'::text, f.work_date::timestamp with time zone)::date AS month_start_date
           FROM initial_data.fact_work_actual_pik f
        ), skpdi AS (
         SELECT d.date_day AS work_date,
            date_trunc('month'::text, d.date_day::timestamp with time zone)::date AS month_start_date,
            sr.work_status_id,
            st.work_status_name,
            wd.work_item_id,
            wd.work_name,
            wd.unit_id,
            u.unit_name,
            wd.estimate_id,
            de.estimate_name,
            wd.estimate_section_id,
            ds.estimate_section_name,
            wd.work_type_id,
            wt.work_type_name,
            COALESCE(sum(sr.quantity_done), 0::numeric) AS quantity_done,
            COALESCE(sum(sr.quantity_done *
                CASE
                    WHEN d.date_day <= '2025-12-31'::date THEN p25.unit_price
                    WHEN d.date_day >= '2026-01-01'::date AND d.date_day <= '2026-05-31'::date THEN p26.unit_price
                    ELSE NULL::numeric
                END), 0::numeric) AS actual_value
           FROM initial_data.fact_work_skpdi_report sr
             JOIN dim_date d ON d.date_day = sr.work_date
             JOIN dim_work_item wd ON wd.work_item_id = sr.work_item_id
             JOIN dim_estimate de ON de.estimate_id = wd.estimate_id
             JOIN dim_estimate_section ds ON ds.estimate_section_id = wd.estimate_section_id
             LEFT JOIN initial_data.fact_price_2025 p25 ON p25.work_item_id = sr.work_item_id AND p25.estimate_id = wd.estimate_id AND p25.estimate_section_id = wd.estimate_section_id
             LEFT JOIN initial_data.fact_price_2026_upto_may p26 ON p26.work_item_id = sr.work_item_id AND p26.estimate_id = wd.estimate_id AND p26.estimate_section_id = wd.estimate_section_id
             LEFT JOIN dim_unit u ON u.unit_id = wd.unit_id
             LEFT JOIN dim_work_type wt ON wt.work_type_id = wd.work_type_id
             LEFT JOIN dim_work_status st ON st.work_status_id = sr.work_status_id
          WHERE NOT (EXISTS ( SELECT 1
                   FROM pik_months pm
                  WHERE pm.month_start_date = date_trunc('month'::text, d.date_day::timestamp with time zone)::date)) AND NOT (EXISTS ( SELECT 1
                   FROM initial_data.fact_work_by_subcontractor fb
                  WHERE fb.work_report_id::numeric = sr.work_report_id))
          GROUP BY d.date_day, sr.work_status_id, st.work_status_name, wd.work_item_id, wd.work_name, wd.unit_id, u.unit_name, wd.estimate_id, de.estimate_name, wd.estimate_section_id, ds.estimate_section_name, wd.work_type_id, wt.work_type_name
        ), pik AS (
         SELECT f.work_date,
            date_trunc('month'::text, f.work_date::timestamp with time zone)::date AS month_start_date,
            3::bigint AS work_status_id,
            'Рассмотрено'::text AS work_status_name,
            wd.work_item_id,
            wd.work_name,
            wd.unit_id,
            u.unit_name,
            wd.estimate_id,
            de.estimate_name,
            wd.estimate_section_id,
            ds.estimate_section_name,
            wd.work_type_id,
            wt.work_type_name,
            COALESCE(sum(f.quantity_done), 0::numeric) AS quantity_done,
            COALESCE(sum(f.quantity_done *
                CASE
                    WHEN f.work_date <= '2025-12-31'::date THEN p25.unit_price
                    WHEN f.work_date >= '2026-01-01'::date AND f.work_date <= '2026-05-31'::date THEN p26.unit_price
                    ELSE NULL::numeric
                END), 0::numeric) AS actual_value
           FROM initial_data.fact_work_actual_pik f
             JOIN dim_work_item wd ON wd.work_name = f.work_name
             JOIN dim_estimate de ON de.estimate_id = wd.estimate_id
             JOIN dim_estimate_section ds ON ds.estimate_section_id = wd.estimate_section_id
             LEFT JOIN initial_data.fact_price_2025 p25 ON p25.work_item_id = wd.work_item_id AND p25.estimate_id = wd.estimate_id AND p25.estimate_section_id = wd.estimate_section_id
             LEFT JOIN initial_data.fact_price_2026_upto_may p26 ON p26.work_item_id = wd.work_item_id AND p26.estimate_id = wd.estimate_id AND p26.estimate_section_id = wd.estimate_section_id
             LEFT JOIN dim_unit u ON u.unit_id = wd.unit_id
             LEFT JOIN dim_work_type wt ON wt.work_type_id = wd.work_type_id
          GROUP BY f.work_date, wd.work_item_id, wd.work_name, wd.unit_id, u.unit_name, wd.estimate_id, de.estimate_name, wd.estimate_section_id, ds.estimate_section_name, wd.work_type_id, wt.work_type_name
        )
 SELECT skpdi.work_date,
    skpdi.month_start_date,
    skpdi.work_status_id,
    skpdi.work_status_name,
    skpdi.work_item_id,
    skpdi.work_name,
    skpdi.unit_id,
    skpdi.unit_name,
    skpdi.estimate_id,
    skpdi.estimate_name,
    skpdi.estimate_section_id,
    skpdi.estimate_section_name,
    skpdi.work_type_id,
    skpdi.work_type_name,
    skpdi.quantity_done,
    skpdi.actual_value
   FROM skpdi
UNION ALL
 SELECT pik.work_date,
    pik.month_start_date,
    pik.work_status_id,
    pik.work_status_name,
    pik.work_item_id,
    pik.work_name,
    pik.unit_id,
    pik.unit_name,
    pik.estimate_id,
    pik.estimate_name,
    pik.estimate_section_id,
    pik.estimate_section_name,
    pik.work_type_id,
    pik.work_type_name,
    pik.quantity_done,
    pik.actual_value
   FROM pik;;

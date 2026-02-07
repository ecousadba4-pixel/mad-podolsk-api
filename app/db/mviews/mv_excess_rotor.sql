-- schema: public
-- name: mv_excess_rotor

CREATE MATERIALIZED VIEW public.mv_excess_rotor AS
 WITH base AS (
         SELECT w.work_date,
            w.work_item_id,
            w.road_section_id,
            vr.unit_id,
            sum(w.quantity_done) AS quantity_sum,
            array_agg(w.done_work_id::bigint ORDER BY w.done_work_id) AS done_work_ids_arr
           FROM mv_work_actual_daily_value_rows w
             JOIN dim_work_item vr ON vr.work_item_id = w.work_item_id
          WHERE w.work_status_id = 3 AND vr.work_type_id = 3 AND w.done_by_subcontractor = false AND w.work_item_id = 307
          GROUP BY w.work_date, w.work_item_id, w.road_section_id, vr.unit_id
        )
 SELECT b.work_date,
    b.done_work_ids_arr AS done_work_ids,
    wi.work_name,
    rs.road_section_name,
    u.unit_name,
    rs.length_km,
    b.quantity_sum * 10::numeric AS quantity_sum,
    b.quantity_sum * 10::numeric - rs.length_km AS excess_volume
   FROM base b
     JOIN dim_road_section rs ON rs.road_section_id = b.road_section_id
     JOIN dim_work_item wi ON wi.work_item_id = b.work_item_id
     JOIN dim_unit u ON u.unit_id = b.unit_id
  WHERE rs.length_km IS NOT NULL AND (b.quantity_sum * 10::numeric) > rs.length_km;;

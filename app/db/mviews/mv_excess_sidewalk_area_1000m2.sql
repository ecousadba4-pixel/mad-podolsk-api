-- schema: public
-- name: mv_excess_sidewalk_area_1000m2

CREATE MATERIALIZED VIEW public.mv_excess_sidewalk_area_1000m2 AS
 WITH base AS (
         SELECT w.work_date,
            w.work_item_id,
            w.road_section_id,
            du.unit_id,
            sum(w.quantity_done) AS quantity_sum,
            array_agg(w.done_work_id::bigint ORDER BY w.done_work_id) AS done_work_ids_arr
           FROM mv_work_actual_daily_value_rows w
             JOIN dim_work_item vr ON vr.work_item_id = w.work_item_id
             JOIN dim_unit du ON du.unit_id = vr.unit_id
          WHERE w.work_status_id = 3 AND vr.work_type_id = 3 AND du.unit_name = '1000 M2'::text AND w.done_by_subcontractor = false
          GROUP BY w.work_date, w.work_item_id, w.road_section_id, du.unit_id
        )
 SELECT b.work_date,
    b.done_work_ids_arr AS done_work_ids,
    wi.work_name,
    rs.road_section_name,
    u.unit_name,
    rs.sidewalk_passport_volume,
    b.quantity_sum,
    b.quantity_sum - COALESCE(rs.sidewalk_passport_volume, 0::numeric) AS excess_volume
   FROM base b
     JOIN dim_road_section rs ON rs.road_section_id = b.road_section_id
     JOIN dim_work_item wi ON wi.work_item_id = b.work_item_id
     JOIN dim_unit u ON u.unit_id = b.unit_id
  WHERE rs.sidewalk_passport_volume IS NOT NULL AND b.quantity_sum > COALESCE(rs.sidewalk_passport_volume, 0::numeric);;

-- schema: public
-- name: mv_excess_road_area_10000m2

CREATE MATERIALIZED VIEW public.mv_excess_road_area_10000m2 AS
 WITH base AS (
         SELECT w.work_date,
            w.work_item_id,
            w.road_section_id,
            vr.unit_id,
            sum(w.quantity_done) AS quantity_sum,
            array_agg(w.done_work_id::bigint ORDER BY w.done_work_id) AS done_work_ids_arr
           FROM mv_work_actual_daily_value_rows w
             JOIN dim_work_item vr ON vr.work_item_id = w.work_item_id
          WHERE w.work_status_id = 3 AND vr.work_type_id = 3 AND vr.unit_id IS NOT NULL AND (vr.unit_id IN ( SELECT du.unit_id
                   FROM dim_unit du
                  WHERE du.unit_name = ANY (ARRAY['1 км'::text, '1000 M2'::text, '10000 M2'::text]))) AND w.done_by_subcontractor = false
          GROUP BY w.work_date, w.work_item_id, w.road_section_id, vr.unit_id
        ), u AS (
         SELECT du.unit_id,
            du.unit_name
           FROM dim_unit du
        ), rs AS (
         SELECT drs.road_section_id,
            drs.road_section_name,
            drs.length_km,
            drs.passport_volume,
            drs.sidewalk_passport_volume
           FROM dim_road_section drs
        ), wi AS (
         SELECT dwi.work_item_id,
            dwi.work_name,
            dwi.work_type_id
           FROM dim_work_item dwi
        )
 SELECT b.work_date,
    b.done_work_ids_arr AS done_work_ids,
    wi.work_name,
    rs.road_section_name,
    u.unit_name,
    rs.passport_volume,
    b.quantity_sum,
    b.quantity_sum - COALESCE(rs.passport_volume, 0::numeric) AS excess_volume
   FROM base b
     JOIN u ON u.unit_id = b.unit_id
     JOIN rs ON rs.road_section_id = b.road_section_id
     JOIN wi ON wi.work_item_id = b.work_item_id
  WHERE u.unit_name = '10000 M2'::text AND rs.passport_volume IS NOT NULL AND b.quantity_sum > COALESCE(rs.passport_volume, 0::numeric);;

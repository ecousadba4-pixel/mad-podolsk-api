-- schema: public
-- name: mv_excess_road_km_1km

CREATE MATERIALIZED VIEW public.mv_excess_road_km_1km AS
 WITH unit_km AS (
         SELECT du.unit_id
           FROM dim_unit du
          WHERE du.unit_name = '1 км'::text
         LIMIT 1
        ), base AS (
         SELECT w.work_date,
            w.work_item_id,
            w.road_section_id,
            vr.unit_id,
            sum(w.quantity_done) AS quantity_sum,
            array_agg(w.done_work_id::bigint ORDER BY w.done_work_id) AS done_work_ids_arr
           FROM mv_work_actual_daily_value_rows w
             JOIN dim_work_item vr ON vr.work_item_id = w.work_item_id
             JOIN unit_km uk ON uk.unit_id = vr.unit_id
          WHERE w.work_status_id = 3 AND vr.work_type_id = 3 AND w.done_by_subcontractor = false
          GROUP BY w.work_date, w.work_item_id, w.road_section_id, vr.unit_id
        ), rs AS (
         SELECT drs.road_section_id,
            drs.road_section_name,
            drs.length_km
           FROM dim_road_section drs
        ), wi AS (
         SELECT dwi.work_item_id,
            dwi.work_name
           FROM dim_work_item dwi
        ), u AS (
         SELECT du.unit_id,
            du.unit_name
           FROM dim_unit du
        )
 SELECT b.work_date,
    b.done_work_ids_arr AS done_work_ids,
    wi.work_name,
    rs.road_section_name,
    u.unit_name,
    rs.length_km,
    rs.length_km * 2::numeric AS passport_volume_two_sides,
    b.quantity_sum,
    b.quantity_sum - rs.length_km * 2::numeric AS excess_volume
   FROM base b
     JOIN rs ON rs.road_section_id = b.road_section_id
     JOIN wi ON wi.work_item_id = b.work_item_id
     JOIN u ON u.unit_id = b.unit_id
  WHERE rs.length_km IS NOT NULL AND b.quantity_sum > (rs.length_km * 2::numeric);;

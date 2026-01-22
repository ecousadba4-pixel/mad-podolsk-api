-- schema: public
-- name: mv_excess_monthly_by_work

CREATE MATERIALIZED VIEW public.mv_excess_monthly_by_work AS
 WITH unified AS (
         SELECT es.work_date,
            es.done_work_ids,
            es.work_name,
            es.excess_volume,
            'тротуары по кв.м.'::text AS excess_type
           FROM mv_excess_sidewalk_area_1000m2 es
        UNION ALL
         SELECT erkm.work_date,
            erkm.done_work_ids,
            erkm.work_name,
            erkm.excess_volume,
            'дороги по км.'::text AS excess_type
           FROM mv_excess_road_km_1km erkm
        UNION ALL
         SELECT era.work_date,
            era.done_work_ids,
            era.work_name,
            era.excess_volume,
            'дороги по кв.м.'::text AS excess_type
           FROM mv_excess_road_area_10000m2 era
        ), exploded AS (
         SELECT date_trunc('month'::text, u.work_date::timestamp with time zone)::date AS month_start_date,
            u.excess_type,
            u.work_name,
            TRIM(BOTH FROM x.x)::bigint AS done_work_id,
            u.excess_volume
           FROM unified u
             CROSS JOIN LATERAL unnest(regexp_split_to_array(COALESCE(u.done_work_ids, ''::text), '\s*,\s*'::text)) x(x)
          WHERE TRIM(BOTH FROM x.x) <> ''::text
        ), agg AS (
         SELECT e.month_start_date,
            e.excess_type,
            e.work_name,
            count(DISTINCT e.done_work_id) AS done_work_id_count,
            sum(e.excess_volume) AS excess_volume_sum
           FROM exploded e
          GROUP BY e.month_start_date, e.excess_type, e.work_name
        ), work_map AS (
         SELECT a.month_start_date,
            a.excess_type,
            a.work_name,
            a.done_work_id_count,
            a.excess_volume_sum,
            dwi.work_item_id
           FROM agg a
             JOIN dim_work_item dwi ON dwi.work_name = a.work_name
        ), price_pick AS (
         SELECT wm.month_start_date,
            wm.excess_type,
            wm.work_name,
            wm.work_item_id,
            wm.done_work_id_count,
            wm.excess_volume_sum,
            max(p.unit_price) AS unit_price
           FROM work_map wm
             LEFT JOIN v_work_item_price_by_date p ON p.work_item_id = wm.work_item_id AND wm.month_start_date >= p.start_date AND wm.month_start_date <= p.end_date
          GROUP BY wm.month_start_date, wm.excess_type, wm.work_name, wm.work_item_id, wm.done_work_id_count, wm.excess_volume_sum
        )
 SELECT month_start_date,
    excess_type,
    work_name,
    work_item_id,
    done_work_id_count,
    excess_volume_sum,
    unit_price,
    excess_volume_sum * unit_price AS excess_cost
   FROM price_pick
  ORDER BY month_start_date, excess_type, work_name;;

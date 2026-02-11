-- schema: public
-- name: mv_vehicle_expected_fuel_daily

CREATE MATERIALIZED VIEW public.mv_vehicle_expected_fuel_daily AS
 WITH daily_mileage AS (
         SELECT fm.vehicles_id,
            fm.period_start::date AS mileage_date,
            sum(fm.mileage_km) AS daily_mileage_km
           FROM initial_data.fact_vehicle_mileage fm
          GROUP BY fm.vehicles_id, (fm.period_start::date)
        )
 SELECT dm.mileage_date,
    v.vehicles_id,
    v.plate_number,
    vt.vehicles_types_id,
    vt.name AS vehicle_type_name,
    vt.fuel_consumption_per_100km AS avg_fuel_consumption_l_per_100km,
    dm.daily_mileage_km,
    round(dm.daily_mileage_km * vt.fuel_consumption_per_100km / 100::numeric, 2) AS expected_fuel_volume_liters
   FROM daily_mileage dm
     JOIN dim_vehicles v ON v.vehicles_id = dm.vehicles_id
     JOIN dim_vehicles_types vt ON vt.vehicles_types_id = v.vehicles_types_id
  WHERE vt.fuel_consumption_per_100km IS NOT NULL;;

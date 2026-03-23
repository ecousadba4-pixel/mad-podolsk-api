"""Repository for fuel consumption (потребление топлива) data access."""

from typing import List
from datetime import date

from app.backend import db

# Fuel facts are per card/day; one employee may have several vehicles in dim_employee_vehicle.
# We split liters/amount evenly across assigned vehicles so list totals stay consistent.
_EMPLOYEE_VEHICLE_COUNT = """
    NULLIF(GREATEST(
        (SELECT COUNT(*)::int FROM public.dim_employee_vehicle evc
         WHERE evc.employee_id = gl.employee_id::int),
        1
    ), 0)
"""


async def get_fuel_general_by_date(
    target_date: date,
) -> List[dict]:
    """Get fuel consumption data for a single date.

    Joins dim_daily_gas_limit → fact_daily_card_fuel (by card_number),
    dim_employee_vehicle → dim_vehicles → dim_vehicles_types,
    and fact_vehicle_mileage (by vehicles_id + date) for mileage.

    Returns list of dicts with employee_name, vehicle_type_name, plate_number,
    mileage_km, liters_total, type_of_gas, amount_for_fuel.
    """
    return await db.query_async(
        f"""
        SELECT
            gl.employee_name,
            vt.name AS vehicle_type_name,
            v.plate_number,
            COALESCE(m.mileage_km, 0) AS mileage_km,
            COALESCE(f.liters_total, 0)::numeric / {_EMPLOYEE_VEHICLE_COUNT.strip()}
                AS liters_total,
            gl.type_of_gas,
            COALESCE(f.amount_for_fuel, 0)::numeric / {_EMPLOYEE_VEHICLE_COUNT.strip()}
                AS amount_for_fuel
        FROM public.dim_daily_gas_limit gl
        JOIN initial_data.fact_daily_card_fuel f
            ON gl.card_number::text = f.card_number
        LEFT JOIN public.dim_employee_vehicle ev
            ON ev.employee_id = gl.employee_id::int
        LEFT JOIN public.dim_vehicles v
            ON v.vehicles_id = ev.vehicles_id
        LEFT JOIN public.dim_vehicles_types vt
            ON v.vehicles_types_id = vt.vehicles_types_id
        LEFT JOIN (
            SELECT
                fm.vehicles_id,
                SUM(fm.mileage_km) AS mileage_km
            FROM initial_data.fact_vehicle_mileage fm
            WHERE fm.period_start::date = %s
            GROUP BY fm.vehicles_id
        ) m ON m.vehicles_id = v.vehicles_id
        WHERE f.date = %s
        ORDER BY gl.employee_name, vt.name, v.plate_number
        """,
        (target_date, target_date),
    )


async def get_fuel_general_by_range(
    date_from: date,
    date_to: date,
) -> List[dict]:
    """Get fuel consumption data for a date range.

    Returns list of dicts with employee_name, vehicle_type_name, plate_number,
    mileage_km, liters_total, type_of_gas, amount_for_fuel.
    """
    return await db.query_async(
        f"""
        SELECT
            gl.employee_name,
            vt.name AS vehicle_type_name,
            v.plate_number,
            COALESCE(m.mileage_km, 0) AS mileage_km,
            COALESCE(
                SUM(f.liters_total::numeric / {_EMPLOYEE_VEHICLE_COUNT.strip()}),
                0
            ) AS liters_total,
            gl.type_of_gas,
            COALESCE(
                SUM(f.amount_for_fuel::numeric / {_EMPLOYEE_VEHICLE_COUNT.strip()}),
                0
            ) AS amount_for_fuel
        FROM public.dim_daily_gas_limit gl
        JOIN initial_data.fact_daily_card_fuel f
            ON gl.card_number::text = f.card_number
        LEFT JOIN public.dim_employee_vehicle ev
            ON ev.employee_id = gl.employee_id::int
        LEFT JOIN public.dim_vehicles v
            ON v.vehicles_id = ev.vehicles_id
        LEFT JOIN public.dim_vehicles_types vt
            ON v.vehicles_types_id = vt.vehicles_types_id
        LEFT JOIN (
            SELECT
                fm.vehicles_id,
                SUM(fm.mileage_km) AS mileage_km
            FROM initial_data.fact_vehicle_mileage fm
            WHERE fm.period_start::date >= %s
              AND fm.period_start::date <= %s
            GROUP BY fm.vehicles_id
        ) m ON m.vehicles_id = v.vehicles_id
        WHERE f.date >= %s
          AND f.date <= %s
        GROUP BY gl.employee_name, vt.name, v.plate_number, gl.type_of_gas,
                 m.mileage_km
        ORDER BY gl.employee_name, vt.name, v.plate_number
        """,
        (date_from, date_to, date_from, date_to),
    )


async def get_fuel_by_driver(
    employee_id: int,
    date_from: date,
    date_to: date,
) -> List[dict]:
    """Get daily fuel consumption for a specific driver within a date range.

    Returns list of dicts with date, mileage_km, liters_total, type_of_gas,
    amount_for_fuel.
    """
    return await db.query_async(
        """
        SELECT
            f.date,
            COALESCE(m.mileage_km, 0) AS mileage_km,
            COALESCE(SUM(f.liters_total), 0) AS liters_total,
            gl.type_of_gas,
            COALESCE(SUM(f.amount_for_fuel), 0) AS amount_for_fuel
        FROM public.dim_daily_gas_limit gl
        JOIN initial_data.fact_daily_card_fuel f
            ON gl.card_number::text = f.card_number
        LEFT JOIN (
            SELECT
                ev.employee_id,
                fm.period_start::date AS mileage_date,
                SUM(fm.mileage_km) AS mileage_km
            FROM initial_data.fact_vehicle_mileage fm
            JOIN public.dim_employee_vehicle ev
                ON ev.vehicles_id = fm.vehicles_id
            WHERE fm.period_start::date >= %s
              AND fm.period_start::date <= %s
            GROUP BY ev.employee_id, fm.period_start::date
        ) m ON m.employee_id = gl.employee_id::int
           AND m.mileage_date = f.date
        WHERE gl.employee_id = %s
          AND f.date >= %s
          AND f.date <= %s
        GROUP BY f.date, m.mileage_km, gl.type_of_gas
        ORDER BY f.date
        """,
        (date_from, date_to, employee_id, date_from, date_to),
    )


async def get_fuel_drivers() -> List[dict]:
    """Get distinct list of drivers that have fuel card assignments.

    Returns list of dicts with employee_id, employee_name.
    """
    return await db.query_async(
        """
        SELECT DISTINCT
            gl.employee_id::int AS employee_id,
            gl.employee_name
        FROM public.dim_daily_gas_limit gl
        WHERE gl.employee_id IS NOT NULL
          AND gl.employee_name IS NOT NULL
        ORDER BY gl.employee_name
        """,
    )

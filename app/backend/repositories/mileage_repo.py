"""Repository for mileage (пробег машин) data access."""

from typing import Optional, List, Any
from datetime import date, time

from app.backend import db


async def get_mileage_by_date(
    target_date: date,
    time_from: Optional[time] = None,
    time_to: Optional[time] = None,
) -> List[dict]:
    """Get aggregated mileage per vehicle for a given date and optional time range.

    Returns list of dicts with vehicle_type_name, plate_number, mileage_km.
    """
    conditions = ["fm.period_start::date = %s"]
    params: List[Any] = [target_date]

    if time_from is not None:
        conditions.append("fm.period_start::time >= %s")
        params.append(time_from)

    if time_to is not None:
        conditions.append("fm.period_end::time <= %s")
        params.append(time_to)

    where_clause = " AND ".join(conditions)

    return await db.query_async(
        f"""
        SELECT
            vt.name AS vehicle_type_name,
            v.plate_number,
            SUM(fm.mileage_km) AS mileage_km
        FROM initial_data.fact_vehicle_mileage fm
        JOIN public.dim_vehicles v ON fm.vehicles_id = v.vehicles_id
        JOIN public.dim_vehicles_types vt ON v.vehicles_types_id = vt.vehicles_types_id
        WHERE {where_clause}
        GROUP BY vt.name, v.plate_number
        ORDER BY vt.name, v.plate_number
        """,
        tuple(params),
    )


async def get_mileage_by_vehicle(
    vehicles_id: int,
    date_from: date,
    date_to: date,
) -> List[dict]:
    """Get daily mileage for a specific vehicle within a date range.

    Returns list of dicts with date and mileage_km.
    """
    return await db.query_async(
        """
        SELECT
            fm.period_start::date AS date,
            SUM(fm.mileage_km) AS mileage_km
        FROM initial_data.fact_vehicle_mileage fm
        WHERE fm.vehicles_id = %s
          AND fm.period_start::date >= %s
          AND fm.period_start::date <= %s
        GROUP BY fm.period_start::date
        ORDER BY fm.period_start::date
        """,
        (vehicles_id, date_from, date_to),
    )


async def get_mileage_by_vehicle_hourly(
    vehicles_id: int,
    date_from: date,
    date_to: date,
) -> List[dict]:
    """Get hourly mileage for a specific vehicle within a date range.

    Returns list of dicts with date, hour_start and mileage_km.
    Only hours with actual mileage data are returned.
    """
    return await db.query_async(
        """
        SELECT
            fm.period_start::date AS date,
            EXTRACT(HOUR FROM fm.period_start)::int AS hour_start,
            SUM(fm.mileage_km) AS mileage_km
        FROM initial_data.fact_vehicle_mileage fm
        WHERE fm.vehicles_id = %s
          AND fm.period_start::date >= %s
          AND fm.period_start::date <= %s
        GROUP BY fm.period_start::date, EXTRACT(HOUR FROM fm.period_start)
        ORDER BY fm.period_start::date, EXTRACT(HOUR FROM fm.period_start)
        """,
        (vehicles_id, date_from, date_to),
    )

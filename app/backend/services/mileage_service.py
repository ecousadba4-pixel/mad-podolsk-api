"""Service for mileage (пробег машин) section.

Handles business logic for vehicle mileage queries.
"""

from typing import Optional, Dict, Any
from datetime import date, time

from app.backend.repositories import mileage_repo


async def get_mileage_by_date(
    target_date: date,
    time_from: Optional[time] = None,
    time_to: Optional[time] = None,
) -> Dict[str, Any]:
    """Get aggregated mileage per vehicle for a given date/time range."""
    rows = await mileage_repo.get_mileage_by_date(
        target_date=target_date,
        time_from=time_from,
        time_to=time_to,
    )

    items = [
        {
            "vehicle_type_name": row["vehicle_type_name"] or "Без типа",
            "plate_number": row["plate_number"],
            "mileage_km": row["mileage_km"],
        }
        for row in rows
    ]

    return {
        "date": target_date,
        "time_from": time_from,
        "time_to": time_to,
        "items": items,
    }


async def get_mileage_by_vehicle(
    vehicles_id: int,
    date_from: date,
    date_to: date,
) -> Dict[str, Any]:
    """Get daily mileage for a specific vehicle within a date range."""
    # Get vehicle info for response
    vehicle_info = await _get_vehicle_info(vehicles_id)

    rows = await mileage_repo.get_mileage_by_vehicle(
        vehicles_id=vehicles_id,
        date_from=date_from,
        date_to=date_to,
    )

    items = [
        {
            "date": row["date"],
            "mileage_km": row["mileage_km"],
        }
        for row in rows
    ]

    return {
        "vehicle_type_name": vehicle_info.get("vehicle_type_name") if vehicle_info else None,
        "plate_number": vehicle_info.get("plate_number") if vehicle_info else None,
        "date_from": date_from,
        "date_to": date_to,
        "items": items,
    }


async def _get_vehicle_info(vehicles_id: int) -> Optional[Dict[str, Any]]:
    """Get vehicle type name and plate number by ID."""
    from app.backend import db
    return await db.query_one_async(
        """
        SELECT
            v.plate_number,
            vt.name AS vehicle_type_name
        FROM public.dim_vehicles v
        JOIN public.dim_vehicles_types vt ON v.vehicles_types_id = vt.vehicles_types_id
        WHERE v.vehicles_id = %s
        """,
        (vehicles_id,),
    )

"""Service for fuel consumption (потребление топлива) section.

Handles business logic for fuel consumption queries.
"""

from typing import Optional, Dict, Any
from datetime import date
from decimal import Decimal

from app.backend.repositories import fuel_repo


async def get_fuel_general(
    target_date: Optional[date] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> Dict[str, Any]:
    """Get fuel consumption general data for a given date or date range."""
    if date_from and date_to:
        rows = await fuel_repo.get_fuel_general_by_range(
            date_from=date_from,
            date_to=date_to,
        )
    elif target_date:
        rows = await fuel_repo.get_fuel_general_by_date(
            target_date=target_date,
        )
    else:
        rows = []

    items = [
        {
            "employee_name": row["employee_name"] or "Без имени",
            "vehicle_type_name": row["vehicle_type_name"] or "Без типа",
            "plate_number": row["plate_number"],
            "mileage_km": row["mileage_km"],
            "liters_total": row["liters_total"],
            "type_of_gas": row["type_of_gas"],
            "amount_for_fuel": row["amount_for_fuel"],
        }
        for row in rows
    ]

    total_amount = sum(Decimal(str(item["amount_for_fuel"])) for item in items)

    result: Dict[str, Any] = {
        "items": items,
        "total_amount": total_amount,
    }

    if date_from and date_to:
        result["date_from"] = date_from
        result["date_to"] = date_to
    else:
        result["date"] = target_date

    return result


async def get_fuel_by_driver(
    employee_id: int,
    date_from: date,
    date_to: date,
) -> Dict[str, Any]:
    """Get daily fuel consumption for a specific driver within a date range."""
    # Get driver name
    driver_info = await _get_driver_info(employee_id)

    rows = await fuel_repo.get_fuel_by_driver(
        employee_id=employee_id,
        date_from=date_from,
        date_to=date_to,
    )

    items = [
        {
            "date": row["date"],
            "mileage_km": row["mileage_km"],
            "liters_total": row["liters_total"],
            "type_of_gas": row["type_of_gas"],
            "amount_for_fuel": row["amount_for_fuel"],
        }
        for row in rows
    ]

    total_mileage = sum(Decimal(str(item["mileage_km"])) for item in items)
    total_liters = sum(Decimal(str(item["liters_total"])) for item in items)
    total_amount = sum(Decimal(str(item["amount_for_fuel"])) for item in items)

    return {
        "employee_name": driver_info.get("employee_name") if driver_info else None,
        "date_from": date_from,
        "date_to": date_to,
        "items": items,
        "total_mileage": total_mileage,
        "total_liters": total_liters,
        "total_amount": total_amount,
    }


async def get_fuel_drivers() -> Dict[str, Any]:
    """Get list of drivers that have fuel card assignments."""
    rows = await fuel_repo.get_fuel_drivers()
    items = [
        {
            "employee_id": row["employee_id"],
            "employee_name": row["employee_name"],
        }
        for row in rows
    ]
    return {"items": items}


async def _get_driver_info(employee_id: int) -> Optional[Dict[str, Any]]:
    """Get driver name by employee_id from dim_daily_gas_limit."""
    from app.backend import db
    return await db.query_one_async(
        """
        SELECT DISTINCT employee_name
        FROM public.dim_daily_gas_limit
        WHERE employee_id = %s
        LIMIT 1
        """,
        (employee_id,),
    )

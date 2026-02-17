"""Router for fuel consumption (потребление топлива) endpoints."""

from typing import Optional
from datetime import date
from fastapi import APIRouter, Query

from app.backend.schemas.fuel import (
    FuelGeneralResponse,
    FuelByDriverResponse,
    FuelDriversResponse,
)
from app.backend.services import fuel_service


router = APIRouter()


@router.get("/general", response_model=FuelGeneralResponse)
async def get_fuel_general(
    target_date: Optional[date] = Query(None, alias="date", description="Single date (YYYY-MM-DD)"),
    date_from: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
):
    """Get fuel consumption general data.

    Supports single date or date range. If date_from and date_to are provided,
    they take precedence over the single date parameter.
    """
    result = await fuel_service.get_fuel_general(
        target_date=target_date,
        date_from=date_from,
        date_to=date_to,
    )
    return FuelGeneralResponse(**result)


@router.get("/by-driver", response_model=FuelByDriverResponse)
async def get_fuel_by_driver(
    employee_id: int = Query(..., description="Employee ID from dim_daily_gas_limit"),
    date_from: date = Query(..., description="Start date (YYYY-MM-DD)"),
    date_to: date = Query(..., description="End date (YYYY-MM-DD)"),
):
    """Get daily fuel consumption for a specific driver within a date range."""
    result = await fuel_service.get_fuel_by_driver(
        employee_id=employee_id,
        date_from=date_from,
        date_to=date_to,
    )
    return FuelByDriverResponse(**result)


@router.get("/drivers", response_model=FuelDriversResponse)
async def get_fuel_drivers():
    """Get list of drivers that have fuel card assignments (for filter dropdown)."""
    result = await fuel_service.get_fuel_drivers()
    return FuelDriversResponse(**result)

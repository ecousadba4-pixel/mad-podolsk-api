"""Router for mileage (пробег машин) endpoints."""

from typing import Optional
from datetime import date, time
from fastapi import APIRouter, Query

from app.backend.schemas.mileage import (
    MileageByDateResponse,
    MileageByVehicleResponse,
)
from app.backend.services import mileage_service


router = APIRouter()


@router.get("/by-date", response_model=MileageByDateResponse)
async def get_mileage_by_date(
    target_date: date = Query(..., alias="date", description="Target date (YYYY-MM-DD)"),
    time_from: Optional[time] = Query(None, description="Filter time from (HH:MM)"),
    time_to: Optional[time] = Query(None, description="Filter time to (HH:MM)"),
):
    """Get aggregated vehicle mileage for a given date and optional time range."""
    result = await mileage_service.get_mileage_by_date(
        target_date=target_date,
        time_from=time_from,
        time_to=time_to,
    )
    return MileageByDateResponse(**result)


@router.get("/by-vehicle", response_model=MileageByVehicleResponse)
async def get_mileage_by_vehicle(
    vehicles_id: int = Query(..., description="Vehicle ID"),
    date_from: date = Query(..., description="Start date (YYYY-MM-DD)"),
    date_to: date = Query(..., description="End date (YYYY-MM-DD)"),
    by_hours: bool = Query(False, description="Include hourly breakdown per day"),
):
    """Get daily mileage for a specific vehicle within a date range.

    When by_hours=true, each day item includes an hourly mileage breakdown.
    """
    result = await mileage_service.get_mileage_by_vehicle(
        vehicles_id=vehicles_id,
        date_from=date_from,
        date_to=date_to,
        by_hours=by_hours,
    )
    return MileageByVehicleResponse(**result)

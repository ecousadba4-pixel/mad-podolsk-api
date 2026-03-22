"""Router for mileage (пробег машин) endpoints."""

from typing import Optional
from datetime import date, time
from fastapi import APIRouter, HTTPException, Query

from app.backend.schemas.mileage import (
    MileageByDateResponse,
    MileageByVehicleResponse,
)
from app.backend.services import mileage_service


router = APIRouter()


@router.get("/by-date", response_model=MileageByDateResponse)
async def get_mileage_by_date(
    target_date: Optional[date] = Query(
        None,
        alias="date",
        description="Single day (YYYY-MM-DD). Use this or date_from+date_to, not both.",
    ),
    date_from: Optional[date] = Query(
        None,
        description="Range start (YYYY-MM-DD), inclusive. Requires date_to.",
    ),
    date_to: Optional[date] = Query(
        None,
        description="Range end (YYYY-MM-DD), inclusive. Requires date_from.",
    ),
    time_from: Optional[time] = Query(None, description="Filter time from (HH:MM)"),
    time_to: Optional[time] = Query(None, description="Filter time to (HH:MM)"),
):
    """Get aggregated vehicle mileage for one day or an inclusive date range.

    Provide either ``date`` (single day) or ``date_from`` and ``date_to`` (period).
    """
    if target_date is not None:
        if date_from is not None or date_to is not None:
            raise HTTPException(
                status_code=422,
                detail="Use either query parameter 'date' or both 'date_from' and 'date_to', not both.",
            )
    elif date_from is not None and date_to is not None:
        if date_from > date_to:
            raise HTTPException(
                status_code=422,
                detail="date_from must be on or before date_to.",
            )
    elif date_from is not None or date_to is not None:
        raise HTTPException(
            status_code=422,
            detail="Both date_from and date_to are required for range mode.",
        )
    else:
        raise HTTPException(
            status_code=422,
            detail="Provide query parameter 'date' or both 'date_from' and 'date_to'.",
        )

    if target_date is not None:
        result = await mileage_service.get_mileage_by_date(
            target_date=target_date,
            time_from=time_from,
            time_to=time_to,
        )
    else:
        result = await mileage_service.get_mileage_by_date(
            date_from=date_from,
            date_to=date_to,
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

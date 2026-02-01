"""Router for prices (расценки) endpoints."""

from typing import Optional
from fastapi import APIRouter, Query

from app.backend.schemas.prices import (
    PricesListResponse,
    PricesFiltersResponse,
)
from app.backend.services import prices_service


router = APIRouter()


@router.get("", response_model=PricesListResponse)
async def get_prices(
    search: Optional[str] = Query(None, description="Search by work name (min 3 chars)"),
    estimate_id: Optional[int] = Query(None, description="Filter by estimate"),
    work_type_id: Optional[int] = Query(None, description="Filter by work type"),
):
    """
    Get list of prices with optional filters.
    Search is triggered when at least 3 characters are provided.
    """
    result = await prices_service.get_prices(search, estimate_id, work_type_id)
    return PricesListResponse(**result)


@router.get("/filters", response_model=PricesFiltersResponse)
async def get_filters():
    """Get available filter options (estimates and work types)."""
    result = await prices_service.get_filters()
    return PricesFiltersResponse(**result)

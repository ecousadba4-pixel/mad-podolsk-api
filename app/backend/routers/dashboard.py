from fastapi import APIRouter, Query
from typing import Optional

from app.backend.schemas.dashboard import (
    CombinedDashboardResponse,
    DailyResponse,
    LoadedAtResponse,
    MonthlyBySmetaResponse,
    MonthlyDailyRevenueResponse,
    MonthlySmetaDescriptionDailyResponse,
    MonthlySmetaDetailsResponse,
    MonthlySummaryResponse,
    TypeOfWorkResponse,
    SmetaDetailsWithTypesResponse,
)
from app.backend.services import dashboard_service

router = APIRouter()


@router.get("", response_model=CombinedDashboardResponse)
async def combined_dashboard(month: Optional[str] = Query(None, description="YYYY-MM or YYYY-MM-DD (optional)")):
    return await dashboard_service.build_combined_dashboard(month)


@router.get("/monthly/summary", response_model=MonthlySummaryResponse)
async def monthly_summary(month: str = Query(..., description="YYYY-MM")):
    month_key = dashboard_service.normalize_month(month)
    return await dashboard_service.build_monthly_summary(month_key)


@router.get("/months", response_model=list)
async def available_months(limit: Optional[int] = Query(None, ge=1, le=120, description="Максимальное количество месяцев")):
    return await dashboard_service.fetch_available_months(limit=limit)


@router.get("/monthly/by-smeta", response_model=MonthlyBySmetaResponse)
async def monthly_by_smeta(month: str = Query(..., description="YYYY-MM")):
    return await dashboard_service.build_monthly_by_smeta(month)


@router.get("/monthly/daily-revenue", response_model=MonthlyDailyRevenueResponse)
async def monthly_daily_revenue(month: str = Query(..., description="YYYY-MM")):
    return await dashboard_service.build_monthly_daily_revenue(month)


@router.get("/monthly/dates", response_model=list)
async def monthly_dates(month: str = Query(..., description="YYYY-MM")):
    return await dashboard_service.fetch_monthly_dates(month)


@router.get("/monthly/smeta-details", response_model=MonthlySmetaDetailsResponse)
async def monthly_smeta_details(month: str = Query(..., description="YYYY-MM"), smeta_key: str = Query(...)):
    return await dashboard_service.build_monthly_smeta_details(month, smeta_key)


@router.get("/monthly/smeta-description-daily", response_model=MonthlySmetaDescriptionDailyResponse)
async def monthly_smeta_description_daily(
    month: str = Query(..., description="YYYY-MM"),
    smeta_key: str = Query(...),
    description_id: str = Query(..., description="Short 12-char hash ID of the description")
):
    """Get daily breakdown for a specific work description.
    
    Use description_id (12-char hash) for URL-safe requests.
    The description_id is returned in the smeta-details endpoint.
    """
    return await dashboard_service.build_monthly_smeta_description_daily_by_id(month, smeta_key, description_id)


@router.get("/last-loaded", response_model=LoadedAtResponse)
async def last_loaded():
    return await dashboard_service.build_last_loaded()


@router.get("/daily", response_model=DailyResponse)
async def daily(
    date: str = Query(
        ...,
        description="YYYY-MM-DD format date",
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        examples=["2025-12-30"],
    )
):
    """Get daily breakdown by date. Date parameter is required in YYYY-MM-DD format."""
    return await dashboard_service.build_daily(date)


@router.get("/monthly/fact-by-type-of-work", response_model=TypeOfWorkResponse)
async def monthly_fact_by_type_of_work(month: str = Query(..., description="YYYY-MM")):
    """Get fact amounts aggregated by type of work for the given month."""
    return await dashboard_service.build_fact_by_type_of_work(month)


@router.get("/monthly/smeta-details-with-types", response_model=SmetaDetailsWithTypesResponse)
async def monthly_smeta_details_with_types(month: str = Query(..., description="YYYY-MM"), smeta_key: str = Query(...)):
    """Get smeta details with type_of_work grouping for hierarchical display."""
    return await dashboard_service.build_smeta_details_with_types(month, smeta_key)

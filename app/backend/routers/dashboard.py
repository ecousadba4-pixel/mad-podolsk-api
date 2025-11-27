from fastapi import APIRouter, HTTPException, Query
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
)
from app.backend.services import dashboard_service

router = APIRouter()


@router.get("", response_model=CombinedDashboardResponse)
def combined_dashboard(month: Optional[str] = Query(None, description="YYYY-MM or YYYY-MM-DD (optional)")):
    return dashboard_service.build_combined_dashboard(month)


@router.get("/monthly/summary", response_model=MonthlySummaryResponse)
def monthly_summary(month: str = Query(..., description="YYYY-MM")):
    month_key = dashboard_service.normalize_month(month)
    return dashboard_service.build_monthly_summary(month_key)


@router.get("/months", response_model=list)
def available_months(limit: Optional[int] = Query(None, ge=1, le=120, description="Максимальное количество месяцев")):
    return dashboard_service.fetch_available_months(limit=limit)


@router.get("/monthly/by-smeta", response_model=MonthlyBySmetaResponse)
def monthly_by_smeta(month: str = Query(..., description="YYYY-MM")):
    return dashboard_service.build_monthly_by_smeta(month)


@router.get("/monthly/daily-revenue", response_model=MonthlyDailyRevenueResponse)
def monthly_daily_revenue(month: str = Query(..., description="YYYY-MM")):
    return dashboard_service.build_monthly_daily_revenue(month)


@router.get("/monthly/dates", response_model=list)
def monthly_dates(month: str = Query(..., description="YYYY-MM")):
    return dashboard_service.fetch_monthly_dates(month)


@router.get("/monthly/smeta-details", response_model=MonthlySmetaDetailsResponse)
def monthly_smeta_details(month: str = Query(..., description="YYYY-MM"), smeta_key: str = Query(...)):
    return dashboard_service.build_monthly_smeta_details(month, smeta_key)


@router.get("/monthly/smeta-description-daily", response_model=MonthlySmetaDescriptionDailyResponse)
def monthly_smeta_description_daily(
    month: str = Query(..., description="YYYY-MM"), smeta_key: str = Query(...), description: str = Query(...)
):
    return dashboard_service.build_monthly_smeta_description_daily(month, smeta_key, description)


@router.get("/last-loaded", response_model=LoadedAtResponse)
def last_loaded():
    return dashboard_service.build_last_loaded()


@router.get("/daily", response_model=DailyResponse)
def daily(date: Optional[str] = Query(None, alias="date", description="YYYY-MM-DD"), day: Optional[str] = Query(None, alias="day", description="YYYY-MM-DD")):
    date_value = date or day
    if not date_value:
        raise HTTPException(status_code=400, detail="date is required")
    return dashboard_service.build_daily(date_value)

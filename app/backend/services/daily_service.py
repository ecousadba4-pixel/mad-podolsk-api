"""
Daily domain service.

Handles daily revenue data, daily breakdowns, and date-related operations.
"""

from typing import Dict, List

from app.backend.repositories import dashboard_repo
from app.backend.services.cache import DAILY_REVENUE_CACHE
from app.backend.services.common import normalize_month, validate_date


# =============================================================================
# Monthly Daily Revenue
# =============================================================================

async def _build_monthly_daily_revenue_uncached(month_key: str) -> Dict:
    """Internal uncached implementation of monthly daily revenue builder."""
    rows = await dashboard_repo.get_monthly_daily_revenue_rows(month_key)
    return {"month": month_key, "rows": rows}


async def build_monthly_daily_revenue(month: str) -> Dict:
    """Build monthly daily revenue with TTL caching."""
    month_key = normalize_month(month)
    cache_key = (month_key,)
    return await DAILY_REVENUE_CACHE.get_or_set(
        cache_key,
        lambda: _build_monthly_daily_revenue_uncached(month_key)
    )


# =============================================================================
# Monthly Dates
# =============================================================================

async def fetch_monthly_dates(month: str) -> List[str]:
    """Return list of available dates (YYYY-MM-DD) for the given month."""
    month_key = normalize_month(month)
    return await dashboard_repo.get_monthly_dates(month_key)


# =============================================================================
# Daily Breakdown
# =============================================================================

async def build_daily(date_value: str) -> Dict:
    """Build daily data for a specific date."""
    validate_date(date_value)

    rows = await dashboard_repo.get_daily_rows(date_value)
    filtered_rows = [r for r in rows if r.get("amount", 0) > 5]
    total_amount = sum(r.get("amount", 0) for r in filtered_rows)
    return {"date": date_value, "rows": filtered_rows, "total": {"amount": total_amount}}


# =============================================================================
# Fact by Type of Work
# =============================================================================

async def build_fact_by_type_of_work(month: str) -> Dict:
    """Build aggregated fact amounts by type_of_work for modal display."""
    month_key = normalize_month(month)
    rows = await dashboard_repo.get_fact_by_type_of_work(month_key)
    total = sum(r.get("amount", 0) for r in rows)
    return {
        "month": month_key,
        "rows": rows,
        "total": total
    }

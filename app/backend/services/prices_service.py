"""Service for prices section."""

from typing import Optional, Dict

from app.backend.repositories import prices_repo


async def get_prices(
    search: Optional[str] = None,
    estimate_id: Optional[int] = None,
    work_type_id: Optional[int] = None,
) -> Dict:
    """Get list of prices with optional filters."""
    rows = await prices_repo.get_prices(search, estimate_id, work_type_id)
    return {
        "rows": rows,
        "total": len(rows),
    }


async def get_filters() -> Dict:
    """Get available filter options."""
    estimates = await prices_repo.get_estimates()
    work_types = await prices_repo.get_work_types()
    return {
        "estimates": estimates,
        "work_types": work_types,
    }

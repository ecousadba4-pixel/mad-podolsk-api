"""
Smeta domain service.

Handles smeta-related operations including smeta details,
description daily breakdowns, and type of work groupings.
"""

from typing import Dict, List

from fastapi import HTTPException

from app.backend.repositories import dashboard_repo
from app.backend.services.cache import (
    SMETA_DETAILS_CACHE,
    SMETA_DETAILS_TYPES_CACHE,
)
from app.backend.services.common import (
    normalize_month,
    smeta_key_to_ids,
    register_descriptions_batch,
    resolve_description_id,
)


# =============================================================================
# Smeta Details
# =============================================================================

async def _build_monthly_smeta_details_uncached(month_key: str, smeta_key: str) -> Dict:
    """Internal uncached implementation of monthly smeta details builder."""
    smeta_ids = smeta_key_to_ids(smeta_key)
    if not smeta_ids:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    include_plan = smeta_key != "vnereglement"
    plan_smeta_id = smeta_ids[0] if include_plan else None

    combined_rows = await dashboard_repo.get_plan_fact_rows_by_smeta(month_key, plan_smeta_id, smeta_ids)

    valid_rows = [
        r for r in combined_rows
        if (r.get("plan") or 0) > 1 or (r.get("fact") or 0) > 1
    ]
    
    descriptions = [r.get("description", "") for r in valid_rows]
    desc_id_map = register_descriptions_batch(descriptions)

    rows: List[Dict] = []
    for r in valid_rows:
        description = r.get("description", "")
        plan_value = r.get("plan") or 0
        fact_value = r.get("fact") or 0
        progress_percent = round((fact_value / plan_value) * 100) if plan_value else 0
        rows.append({
            "description": description,
            "description_id": desc_id_map.get(description, ""),
            "plan": plan_value,
            "fact": fact_value,
            "delta": fact_value - plan_value,
            "progress_percent": progress_percent,
        })

    return {"month": month_key, "smeta_key": smeta_key, "rows": rows}


async def build_monthly_smeta_details(month: str, smeta_key: str) -> Dict:
    """Build monthly smeta details with TTL caching."""
    month_key = normalize_month(month)
    cache_key = (month_key, smeta_key)
    return await SMETA_DETAILS_CACHE.get_or_set(
        cache_key,
        lambda: _build_monthly_smeta_details_uncached(month_key, smeta_key)
    )


# =============================================================================
# Smeta Description Daily
# =============================================================================

async def build_monthly_smeta_description_daily_by_id(month: str, smeta_key: str, description_id: str) -> Dict:
    """Build smeta description daily data using description_id."""
    description = resolve_description_id(description_id)
    if not description:
        raise HTTPException(status_code=404, detail="description_id not found - please load smeta details first")
    return await build_monthly_smeta_description_daily(month, smeta_key, description)


async def build_monthly_smeta_description_daily(month: str, smeta_key: str, description: str) -> Dict:
    """Build smeta description daily data."""
    month_key = normalize_month(month)
    smeta_ids = smeta_key_to_ids(smeta_key)
    if not smeta_ids:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    rows = await dashboard_repo.get_description_daily_rows(month_key, description, smeta_ids)
    return {"month": month_key, "smeta_key": smeta_key, "description": description, "rows": rows}


# =============================================================================
# Smeta Details with Types
# =============================================================================

async def _build_smeta_details_with_types_uncached(month_key: str, smeta_key: str) -> Dict:
    """Internal uncached implementation of smeta details with types builder."""
    smeta_ids = smeta_key_to_ids(smeta_key)
    if not smeta_ids:
        raise HTTPException(status_code=400, detail="invalid smeta_key")

    raw_rows = await dashboard_repo.get_smeta_details_with_type_of_work(month_key, smeta_ids)
    
    is_vnereg = smeta_key == "vnereglement"
    descriptions = [r.get("description", "") for r in raw_rows]
    desc_id_map = register_descriptions_batch(descriptions)
    
    rows: List[Dict] = []
    for r in raw_rows:
        plan = 0 if is_vnereg else r.get("plan", 0)
        fact = r.get("fact", 0)
        description = r.get("description", "")
        progress_percent = round((fact / plan) * 100) if plan else 0
        rows.append({
            "type_of_work": r.get("type_of_work"),
            "description": description,
            "description_id": desc_id_map.get(description, ""),
            "plan": plan,
            "fact": fact,
            "delta": fact - plan,
            "progress_percent": progress_percent,
        })
    
    return {
        "month": month_key,
        "smeta_key": smeta_key,
        "rows": rows
    }


async def build_smeta_details_with_types(month: str, smeta_key: str) -> Dict:
    """Build smeta details with type_of_work grouping with TTL caching."""
    month_key = normalize_month(month)
    cache_key = (month_key, smeta_key)
    return await SMETA_DETAILS_TYPES_CACHE.get_or_set(
        cache_key,
        lambda: _build_smeta_details_with_types_uncached(month_key, smeta_key)
    )

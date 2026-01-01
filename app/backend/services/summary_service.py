"""
Summary domain service.

Handles monthly summary data including KPI, contract execution,
plan/fact calculations, and available months.
"""

import asyncio
from typing import Dict, List, Optional

from fastapi import HTTPException

from app.backend.repositories import dashboard_repo
from app.backend.services.cache import (
    MONTHS_CACHE,
    LAST_LOADED_CACHE,
    COMBINED_DASHBOARD_CACHE,
    check_and_invalidate_on_data_change,
)
from app.backend.services.common import (
    SMETA_LABELS,
    normalize_month,
    compute_avg_daily_revenue,
)


# =============================================================================
# Available Months
# =============================================================================

async def fetch_available_months(limit: Optional[int] = None) -> List[str]:
    """Fetch available months from all sources concurrently."""
    async def _load_months():
        months_set = set()
        
        # Run all three queries concurrently
        results = await asyncio.gather(
            dashboard_repo.get_months_from_plan_vs_fact_monthly(),
            dashboard_repo.get_months_from_plan_fact_backend(),
            dashboard_repo.get_months_from_fact_with_money(),
            return_exceptions=True
        )
        
        for rows in results:
            if isinstance(rows, Exception):
                continue
            for r in rows:
                raw_month = r.get("month") or r.get("month_key") or r.get("month_start")
                if not raw_month:
                    continue
                try:
                    normalized = normalize_month(str(raw_month))
                except HTTPException:
                    continue
                months_set.add(normalized)
        
        return sorted(months_set, reverse=True)
    
    months = await MONTHS_CACHE.get_or_set(_load_months)
    if limit is not None:
        return months[:limit]
    return months


# =============================================================================
# Plan/Fact Calculation
# =============================================================================

async def compute_plan_fact(month: str, plan_fact_row: Optional[dict] = None) -> Dict:
    """Compute plan/fact data for a month."""
    month_key = normalize_month(month)
    row = plan_fact_row or await dashboard_repo.get_plan_fact_month(month_key)

    if not row:
        row = {
            "month_key": month_key,
            "plan_leto": 0,
            "plan_zima": 0,
            "plan_vnereglament": None,
            "plan_total": None,
            "fact_leto": 0,
            "fact_zima": 0,
            "fact_vnereglament": None,
            "fact_total": 0,
        }

    plan_leto = row.get("plan_leto") or 0
    plan_zima = row.get("plan_zima") or 0

    try:
        plan_vnereglament = int(round((plan_leto + plan_zima) * 0.43))
    except Exception:
        plan_vnereglament = 0

    plan_total = int(plan_leto + plan_zima + plan_vnereglament)

    fact_leto = row.get("fact_leto") or 0
    fact_zima = row.get("fact_zima") or 0
    fact_vnereglament = row.get("fact_vnereglament")
    if fact_vnereglament is None:
        sum_from_bundle = row.get("sum_fact_vnereglament")
        if sum_from_bundle is not None:
            fact_vnereglament = sum_from_bundle
        else:
            r = await dashboard_repo.sum_fact_vnereglament(month_key)
            fact_vnereglament = r.get("s") if r else 0
    else:
        fact_vnereglament = fact_vnereglament or 0

    fact_total = row.get("fact_total") or (fact_leto + fact_zima + fact_vnereglament)

    return {
        "month_key": row.get("month_key", month_key),
        "plan_leto": plan_leto,
        "plan_zima": plan_zima,
        "plan_vnereglament": plan_vnereglament,
        "plan_total": plan_total,
        "fact_leto": fact_leto,
        "fact_zima": fact_zima,
        "fact_vnereglament": fact_vnereglament,
        "fact_total": fact_total,
    }


# =============================================================================
# Contract Amount
# =============================================================================

async def compute_contract_amount(month_key: Optional[str] = None, contract_row: Optional[dict] = None) -> int:
    """Compute contract amount."""
    row = contract_row or await dashboard_repo.get_contract_amount_sum(month_key)
    if not row:
        return 0
    return row.get("sum") or row.get("contract_amount") or 0


# =============================================================================
# Monthly Summary
# =============================================================================

async def build_monthly_summary(month_key: str, bundle: Optional[dict] = None) -> Dict:
    """Build monthly summary with KPI and contract data."""
    plan_fact = await compute_plan_fact(month_key, plan_fact_row=bundle)
    summa_contract = await compute_contract_amount(month_key, bundle)
    
    if bundle:
        total_fact_all_months = bundle.get("fact_total_all_months") or 0
    else:
        total_fact_all_months = 0
    
    if not total_fact_all_months and not bundle:
        total_fact_row = await dashboard_repo.get_total_fact_amount(month_key)
        total_fact_all_months = total_fact_row["sum"] if total_fact_row else 0
    
    contract_planfact_pct = float(total_fact_all_months / summa_contract) if summa_contract else None
    avg_daily_revenue = compute_avg_daily_revenue(month_key, plan_fact["fact_total"])

    return {
        "month": month_key,
        "contract": {
            "summa_contract": summa_contract,
            "fact_total": total_fact_all_months,
            "contract_planfact_pct": contract_planfact_pct,
        },
        "kpi": {
            "plan_total": plan_fact["plan_total"],
            "fact_total": plan_fact["fact_total"],
            "delta": plan_fact["fact_total"] - plan_fact["plan_total"],
            "avg_daily_revenue": avg_daily_revenue,
        },
    }


# =============================================================================
# Monthly by Smeta (Cards)
# =============================================================================

async def build_monthly_by_smeta(month: str, plan_fact: Optional[dict] = None) -> Dict:
    """Build monthly data by smeta for card display."""
    plan_fact = plan_fact or await compute_plan_fact(month)
    cards = []
    plan_keys = {
        "leto": ("plan_leto", "fact_leto"),
        "zima": ("plan_zima", "fact_zima"),
        "vnereglement": ("plan_vnereglament", "fact_vnereglament"),
    }
    for smeta_key, (plan_key, fact_key) in plan_keys.items():
        plan_value = plan_fact[plan_key]
        fact_value = plan_fact[fact_key]
        progress_percent = round((fact_value / plan_value) * 100) if plan_value else 0
        cards.append(
            {
                "smeta_key": smeta_key,
                "label": SMETA_LABELS[smeta_key],
                "plan": plan_value,
                "fact": fact_value,
                "delta": fact_value - plan_value,
                "progress_percent": progress_percent,
            }
        )
    return {"month": plan_fact["month_key"], "cards": cards}


# =============================================================================
# Last Loaded
# =============================================================================

async def build_last_loaded() -> Dict:
    """Build last loaded response."""
    row = await LAST_LOADED_CACHE.get_or_set(dashboard_repo.get_last_loaded_row)
    if not row:
        return {"loaded_at": None}
    loaded = row.get("loaded_at")
    if loaded is None:
        return {"loaded_at": None}
    try:
        return {"loaded_at": loaded.isoformat()}
    except Exception:
        return {"loaded_at": str(loaded)}


# =============================================================================
# Combined Dashboard (DEPRECATED)
# =============================================================================
# NOTE: Combined dashboard endpoint removed in API v1
# Kept for potential internal use only. Do not expose via API.

async def _build_combined_dashboard_uncached(month_key: Optional[str]) -> Dict:
    """Internal uncached implementation of combined dashboard builder."""
    summary = {
        "planned_amount": None,
        "fact_amount": None,
        "completion_pct": None,
        "delta_amount": None,
        "contract_amount": None,
        "contract_executed": None,
        "contract_completion_pct": None,
        "average_daily_revenue": None,
        "daily_revenue": None,
    }
    items: List[dict] = []
    cards: List[dict] = []
    available_months = await fetch_available_months(limit=24)

    if month_key:
        bundle = await dashboard_repo.get_month_summary_bundle(month_key)
        plan_fact = await compute_plan_fact(month_key, plan_fact_row=bundle)
        contract_amount = await compute_contract_amount(month_key, bundle)
        contract_completion_pct = (float(plan_fact["fact_total"]) / contract_amount) if contract_amount else None
        avg_daily_revenue = compute_avg_daily_revenue(month_key, plan_fact["fact_total"])

        summary.update(
            {
                "planned_amount": float(plan_fact["plan_total"]),
                "fact_amount": float(plan_fact["fact_total"]),
                "completion_pct": None,
                "delta_amount": float(plan_fact["fact_total"] - plan_fact["plan_total"]),
                "contract_amount": contract_amount,
                "contract_executed": None,
                "contract_completion_pct": contract_completion_pct,
                "average_daily_revenue": avg_daily_revenue,
            }
        )

        bundle_items = bundle.get("items") if bundle else None
        if bundle_items is not None:
            items = bundle_items if isinstance(bundle_items, list) else []
        else:
            items = await dashboard_repo.get_monthly_items(month_key)
        
        try:
            cards = (await build_monthly_by_smeta(month_key, plan_fact))["cards"]
        except Exception:
            cards = []

    last_updated_row = await LAST_LOADED_CACHE.get_or_set(dashboard_repo.get_last_loaded_row)
    last_updated = None
    if last_updated_row:
        loaded = last_updated_row.get("loaded_at")
        try:
            last_updated = loaded.isoformat()
        except Exception:
            last_updated = str(loaded)

    return {
        "month": month_key or None,
        "last_updated": last_updated,
        "summary": summary,
        "items": items,
        "cards": cards if month_key else [],
        "has_data": bool(items),
        "available_months": available_months,
    }


async def build_combined_dashboard(month: Optional[str]) -> Dict:
    """Build combined dashboard with TTL caching and automatic invalidation."""
    # Check for data changes and invalidate if needed
    await check_and_invalidate_on_data_change()
    
    month_key = normalize_month(month) if month else None
    cache_key = (month_key,)
    return await COMBINED_DASHBOARD_CACHE.get_or_set(
        cache_key,
        lambda: _build_combined_dashboard_uncached(month_key)
    )

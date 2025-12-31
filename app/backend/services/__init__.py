"""
Dashboard services package.

Domain-driven service modules:
- summary_service: Monthly summary, KPI, contract execution
- daily_service: Daily revenue and breakdowns
- smeta_service: Smeta details and type of work
- cache: Caching infrastructure
- common: Shared utilities

For backward compatibility, dashboard_service re-exports all public functions.
"""

from app.backend.services.dashboard_service import (
    # Cache
    invalidate_all_caches,
    # Common
    SMETA_LABELS,
    normalize_month,
    smeta_key_to_ids,
    compute_avg_daily_revenue,
    register_descriptions_batch,
    resolve_description_id,
    # Summary
    fetch_available_months,
    compute_plan_fact,
    compute_contract_amount,
    build_monthly_summary,
    build_monthly_by_smeta,
    build_last_loaded,
    build_combined_dashboard,
    # Daily
    build_monthly_daily_revenue,
    fetch_monthly_dates,
    build_daily,
    build_fact_by_type_of_work,
    # Smeta
    build_monthly_smeta_details,
    build_monthly_smeta_description_daily_by_id,
    build_monthly_smeta_description_daily,
    build_smeta_details_with_types,
)

__all__ = [
    # Cache
    "invalidate_all_caches",
    # Common
    "SMETA_LABELS",
    "normalize_month",
    "smeta_key_to_ids",
    "compute_avg_daily_revenue",
    "register_descriptions_batch",
    "resolve_description_id",
    # Summary
    "fetch_available_months",
    "compute_plan_fact",
    "compute_contract_amount",
    "build_monthly_summary",
    "build_monthly_by_smeta",
    "build_last_loaded",
    "build_combined_dashboard",
    # Daily
    "build_monthly_daily_revenue",
    "fetch_monthly_dates",
    "build_daily",
    "build_fact_by_type_of_work",
    # Smeta
    "build_monthly_smeta_details",
    "build_monthly_smeta_description_daily_by_id",
    "build_monthly_smeta_description_daily",
    "build_smeta_details_with_types",
]

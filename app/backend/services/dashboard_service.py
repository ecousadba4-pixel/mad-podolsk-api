"""
Dashboard service - facade module for backward compatibility.

This module re-exports all service functions from domain-specific modules
to maintain API compatibility with existing code.

Domain modules:
- summary_service: Monthly summary, KPI, contract execution, available months
- daily_service: Daily revenue, daily breakdowns, dates
- smeta_service: Smeta details, description daily, type of work groupings
- cache: Caching infrastructure
- common: Shared utilities and constants
"""

# Re-export cache functions
from app.backend.services.cache import (
    invalidate_all_caches,
)

# Re-export common utilities
from app.backend.services.common import (
    SMETA_LABELS,
    normalize_month,
    smeta_key_to_ids,
    compute_avg_daily_revenue,
    register_descriptions_batch,
    resolve_description_id,
)

# Re-export summary service functions
from app.backend.services.summary_service import (
    fetch_available_months,
    compute_plan_fact,
    compute_contract_amount,
    build_monthly_summary,
    build_monthly_by_smeta,
    build_last_loaded,
    build_combined_dashboard,
)

# Re-export daily service functions
from app.backend.services.daily_service import (
    build_monthly_daily_revenue,
    fetch_monthly_dates,
    build_daily,
    build_fact_by_type_of_work,
)

# Re-export smeta service functions
from app.backend.services.smeta_service import (
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

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class _BaseSchema(BaseModel):
    """Base schema with optimized serialization settings."""
    model_config = ConfigDict(
        extra="ignore",
        from_attributes=True,
        ser_json_inf_nan="constants",
    )


class SmetaCard(_BaseSchema):
    smeta_key: str
    label: str
    plan: int
    fact: int
    delta: int


class MonthlyBySmetaResponse(_BaseSchema):
    month: str
    cards: List[SmetaCard]


class ContractSummary(_BaseSchema):
    summa_contract: int
    fact_total: int
    contract_planfact_pct: Optional[float]


class KpiSummary(_BaseSchema):
    plan_total: int
    fact_total: int
    delta: int
    avg_daily_revenue: int


class MonthlySummaryResponse(_BaseSchema):
    month: str
    contract: ContractSummary
    kpi: KpiSummary


class MonthlyDailyRevenueRow(_BaseSchema):
    date: str
    amount: int


class MonthlyDailyRevenueResponse(_BaseSchema):
    month: str
    rows: List[MonthlyDailyRevenueRow]


class SmetaDetailRow(_BaseSchema):
    description: str
    description_id: str  # Short hash ID for URL-safe references
    plan: int
    fact: int
    delta: int


class MonthlySmetaDetailsResponse(_BaseSchema):
    month: str
    smeta_key: str
    rows: List[SmetaDetailRow]


class SmetaDescriptionDailyRow(_BaseSchema):
    date: str
    volume: int
    unit: Optional[str]
    amount: int


class MonthlySmetaDescriptionDailyResponse(_BaseSchema):
    month: str
    smeta_key: str
    description: str
    rows: List[SmetaDescriptionDailyRow]


class CombinedSummary(_BaseSchema):
    planned_amount: Optional[float]
    fact_amount: Optional[float]
    completion_pct: Optional[float]
    delta_amount: Optional[float]
    contract_amount: Optional[int]
    contract_executed: Optional[int]
    contract_completion_pct: Optional[float]
    average_daily_revenue: Optional[int]
    daily_revenue: Optional[int]


class CombinedDashboardResponse(_BaseSchema):
    month: Optional[str]
    last_updated: Optional[str]
    summary: CombinedSummary
    items: list
    cards: Optional[List[SmetaCard]]
    has_data: bool
    available_months: List[str]


class LoadedAtResponse(_BaseSchema):
    loaded_at: Optional[str]


class DailyRow(_BaseSchema):
    description: str
    unit: Optional[str]
    volume: int
    amount: int


class DailyTotal(_BaseSchema):
    amount: int


class DailyResponse(_BaseSchema):
    date: str
    rows: List[DailyRow]
    total: DailyTotal


# --- Type of Work schemas ---

class TypeOfWorkRow(_BaseSchema):
    type_of_work: Optional[str]
    amount: int


class TypeOfWorkResponse(_BaseSchema):
    month: str
    rows: List[TypeOfWorkRow]
    total: int


class SmetaDetailWithTypeRow(_BaseSchema):
    type_of_work: Optional[str]
    description: str
    description_id: str  # Short hash ID for URL-safe references
    plan: int
    fact: int
    delta: int


class SmetaDetailsWithTypesResponse(_BaseSchema):
    month: str
    smeta_key: str
    rows: List[SmetaDetailWithTypeRow]

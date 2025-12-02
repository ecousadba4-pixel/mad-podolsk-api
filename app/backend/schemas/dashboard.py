from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class SmetaCard(BaseModel):
    smeta_key: str
    label: str
    plan: int
    fact: int
    delta: int


class MonthlyBySmetaResponse(BaseModel):
    month: str
    cards: List[SmetaCard]


class ContractSummary(BaseModel):
    summa_contract: int
    fact_total: int
    contract_planfact_pct: Optional[float]


class KpiSummary(BaseModel):
    plan_total: int
    fact_total: int
    delta: int
    avg_daily_revenue: int


class MonthlySummaryResponse(BaseModel):
    month: str
    contract: ContractSummary
    kpi: KpiSummary


class MonthlyDailyRevenueRow(BaseModel):
    date: str
    amount: int


class MonthlyDailyRevenueResponse(BaseModel):
    month: str
    rows: List[MonthlyDailyRevenueRow]


class SmetaDetailRow(BaseModel):
    description: str
    plan: int
    fact: int
    delta: int


class MonthlySmetaDetailsResponse(BaseModel):
    month: str
    smeta_key: str
    rows: List[SmetaDetailRow]


class SmetaDescriptionDailyRow(BaseModel):
    date: str
    volume: int
    unit: Optional[str]
    amount: int


class MonthlySmetaDescriptionDailyResponse(BaseModel):
    month: str
    smeta_key: str
    description: str
    rows: List[SmetaDescriptionDailyRow]


class CombinedSummary(BaseModel):
    planned_amount: Optional[float]
    fact_amount: Optional[float]
    completion_pct: Optional[float]
    delta_amount: Optional[float]
    contract_amount: Optional[int]
    contract_executed: Optional[int]
    contract_completion_pct: Optional[float]
    average_daily_revenue: Optional[int]
    daily_revenue: Optional[int]


class CombinedDashboardResponse(BaseModel):
    month: Optional[str]
    last_updated: Optional[str]
    summary: CombinedSummary
    items: list
    cards: Optional[List[SmetaCard]]
    has_data: bool
    available_months: List[str]


class LoadedAtResponse(BaseModel):
    loaded_at: Optional[str]


class DailyRow(BaseModel):
    description: str
    unit: Optional[str]
    volume: int
    amount: int


class DailyTotal(BaseModel):
    amount: int


class DailyResponse(BaseModel):
    date: str
    rows: List[DailyRow]
    total: DailyTotal


# --- Type of Work schemas ---

class TypeOfWorkRow(BaseModel):
    type_of_work: str
    amount: int


class TypeOfWorkResponse(BaseModel):
    month: str
    rows: List[TypeOfWorkRow]
    total: int


class SmetaDetailWithTypeRow(BaseModel):
    type_of_work: str
    description: str
    plan: int
    fact: int
    delta: int


class SmetaDetailsWithTypesResponse(BaseModel):
    month: str
    smeta_key: str
    rows: List[SmetaDetailWithTypeRow]

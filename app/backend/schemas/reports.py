"""Pydantic schemas for PDF report endpoints."""
from datetime import date
from typing import Optional

from pydantic import BaseModel, field_validator


class MonthlyReportParams(BaseModel):
    """Query parameters for monthly PDF report generation."""
    month: str  # Format: YYYY-MM

    @field_validator("month")
    @classmethod
    def validate_month(cls, v: str) -> str:
        """Validate month format YYYY-MM."""
        import re
        if not re.match(r"^\d{4}-\d{2}$", v):
            raise ValueError("month must be in YYYY-MM format")
        return v

    def to_date(self) -> date:
        """Convert month string to first day of that month."""
        year, month = map(int, self.month.split("-"))
        return date(year, month, 1)


class ReportWorkItem(BaseModel):
    """Single work item in the report."""
    smeta_code: str
    description: str
    unit: Optional[str] = None
    fact_volume_done: Optional[float] = 0.0
    fact_amount_done: Optional[float] = 0.0


class SmetaGroup(BaseModel):
    """Group of work items by smeta code with subtotal."""
    smeta_code: str
    items: list[ReportWorkItem]
    subtotal: float


class MonthlyReportData(BaseModel):
    """Data structure for monthly report template."""
    month_start: date
    report_date: date  # Date when report was generated
    data_loaded_at: Optional[str] = None  # Last data update date (formatted)
    smeta_groups: list[SmetaGroup]
    grand_total: float

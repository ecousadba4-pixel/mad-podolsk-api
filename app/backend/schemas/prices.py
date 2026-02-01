"""Schemas for prices (расценки) section."""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class _BaseSchema(BaseModel):
    """Base schema with optimized serialization settings."""
    model_config = ConfigDict(
        extra="ignore",
        from_attributes=True,
        ser_json_inf_nan="constants",
    )


class PriceRow(_BaseSchema):
    """Single price row."""
    price_id: int
    estimate_name: Optional[str]
    estimate_section_name: Optional[str]
    work_type_name: Optional[str]
    work_name: Optional[str]
    unit_name: Optional[str]
    unit_price: Optional[float]


class PricesListResponse(_BaseSchema):
    """Response with list of prices."""
    rows: List[PriceRow]
    total: int


class EstimateOption(_BaseSchema):
    """Estimate filter option."""
    estimate_id: int
    estimate_name: str


class WorkTypeOption(_BaseSchema):
    """Work type filter option."""
    work_type_id: int
    work_type_name: str


class PricesFiltersResponse(_BaseSchema):
    """Available filter options for prices."""
    estimates: List[EstimateOption]
    work_types: List[WorkTypeOption]

"""Schemas for fuel consumption (потребление топлива) section."""

from typing import List, Optional
import datetime
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class _BaseSchema(BaseModel):
    """Base schema with optimized serialization settings."""
    model_config = ConfigDict(
        extra="ignore",
        from_attributes=True,
        ser_json_inf_nan="constants",
    )


# =============================================================================
# Fuel General Data Schemas (Общие данные)
# =============================================================================

class FuelGeneralItem(_BaseSchema):
    """Single row in fuel general data table."""
    employee_name: str
    vehicle_type_name: str
    plate_number: str
    mileage_km: Decimal
    liters_total: Decimal
    type_of_gas: Optional[str] = None
    amount_for_fuel: Decimal


class FuelGeneralResponse(_BaseSchema):
    """Response for fuel general data query."""
    date: Optional[datetime.date] = None
    date_from: Optional[datetime.date] = None
    date_to: Optional[datetime.date] = None
    items: List[FuelGeneralItem]
    total_amount: Decimal


# =============================================================================
# Fuel By Driver Schemas (По водителям)
# =============================================================================

class FuelByDriverItem(_BaseSchema):
    """Single row in fuel-by-driver table."""
    date: date
    mileage_km: Decimal
    liters_total: Decimal
    type_of_gas: Optional[str] = None
    amount_for_fuel: Decimal


class FuelByDriverResponse(_BaseSchema):
    """Response for fuel-by-driver query."""
    employee_name: Optional[str] = None
    date_from: date
    date_to: date
    items: List[FuelByDriverItem]
    total_mileage: Decimal
    total_liters: Decimal
    total_amount: Decimal


# =============================================================================
# Fuel Drivers List Schema (Список водителей для фильтра)
# =============================================================================

class FuelDriverItem(_BaseSchema):
    """Driver item for dropdown filter."""
    employee_id: int
    employee_name: str


class FuelDriversResponse(_BaseSchema):
    """Response for fuel drivers list."""
    items: List[FuelDriverItem]

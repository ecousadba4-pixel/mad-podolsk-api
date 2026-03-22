"""Schemas for mileage (пробег машин) section."""

from typing import List, Optional
from datetime import date, time
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
# Mileage By Date Schemas (По дате)
# =============================================================================

class MileageByDateItem(_BaseSchema):
    """Single row in mileage-by-date table."""
    vehicle_type_name: str
    plate_number: str
    mileage_km: Decimal


class MileageByDateResponse(_BaseSchema):
    """Response for mileage-by-date query.

    Single-day mode: only ``date`` is set. Range mode: ``date`` matches ``date_from``,
    and ``date_from`` / ``date_to`` describe the inclusive period.
    """

    date: date
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    time_from: Optional[time] = None
    time_to: Optional[time] = None
    items: List[MileageByDateItem]


# =============================================================================
# Mileage By Vehicle Schemas (По машине)
# =============================================================================

class MileageByVehicleHourItem(_BaseSchema):
    """Single hourly segment in mileage-by-vehicle expanded row."""
    hour_from: int
    hour_to: int
    mileage_km: Decimal


class MileageByVehicleItem(_BaseSchema):
    """Single row in mileage-by-vehicle table."""
    date: date
    mileage_km: Decimal
    hours: Optional[List[MileageByVehicleHourItem]] = None


class MileageByVehicleResponse(_BaseSchema):
    """Response for mileage-by-vehicle query."""
    vehicle_type_name: Optional[str] = None
    plate_number: Optional[str] = None
    date_from: date
    date_to: date
    items: List[MileageByVehicleItem]

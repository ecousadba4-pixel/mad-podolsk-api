"""Schemas for resources (учет техники и людей) section."""

from typing import List, Optional
from datetime import date, time, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class _BaseSchema(BaseModel):
    """Base schema with optimized serialization settings."""
    model_config = ConfigDict(
        extra="ignore",
        from_attributes=True,
        ser_json_inf_nan="constants",
    )


# =============================================================================
# Reference Data Schemas (Справочники)
# =============================================================================

class EquipmentType(_BaseSchema):
    """Equipment type reference."""
    id: int
    name: str
    is_active: bool = True


class Vehicle(_BaseSchema):
    """Own vehicle (собственная техника)."""
    id: int
    equipment_type_id: int
    plate_number: str
    is_active: bool = True


class VehicleWithType(_BaseSchema):
    """Vehicle with equipment type name for display."""
    id: int
    equipment_type_id: int
    equipment_type_name: Optional[str] = None
    plate_number: str
    is_active: bool = True


class Driver(_BaseSchema):
    """Driver reference."""
    id: int
    full_name: str
    phone: Optional[str] = None
    is_active: bool = True


class Master(_BaseSchema):
    """Master reference."""
    id: int
    full_name: str
    phone: Optional[str] = None
    is_active: bool = True


# =============================================================================
# Equipment Shift Schemas (Смены техники)
# =============================================================================

class EquipmentShiftCreate(_BaseSchema):
    """Request to create equipment shift."""
    is_own: bool
    # For own equipment
    vehicle_id: Optional[int] = None
    driver_id: Optional[int] = None
    # For both own and rented
    equipment_type_id: int
    plate_number: str
    driver_name: Optional[str] = None  # For rented equipment or as fallback
    # Shift details
    shift_start_date: date
    shift_start_time: time
    shift_duration_hours: Decimal = Field(..., ge=0.5, le=24)


class EquipmentShiftUpdate(_BaseSchema):
    """Request to update equipment shift (limited fields)."""
    # Can't change: plate_number, shift_start_date, is_own, vehicle_id
    equipment_type_id: Optional[int] = None
    driver_id: Optional[int] = None
    driver_name: Optional[str] = None
    shift_start_time: Optional[time] = None
    shift_duration_hours: Optional[Decimal] = Field(None, ge=0.5, le=24)


class EquipmentShiftResponse(_BaseSchema):
    """Equipment shift response."""
    id: int
    is_own: bool
    vehicle_id: Optional[int] = None
    equipment_type_id: int
    equipment_type_name: Optional[str] = None
    plate_number: str
    driver_id: Optional[int] = None
    driver_name: Optional[str] = None
    shift_start_date: date
    shift_start_time: time
    shift_start_at: Optional[datetime] = None
    shift_duration_hours: Decimal
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_deleted: bool = False


class EquipmentShiftSearchRequest(_BaseSchema):
    """Request to search for equipment shift by plate and date."""
    plate_number: str
    shift_start_date: date


class EquipmentShiftDeleteRequest(_BaseSchema):
    """Request to delete (soft) equipment shift."""
    delete_reason: str = Field(..., min_length=5, max_length=100)


# =============================================================================
# Master Shift Schemas (Смены мастеров)
# =============================================================================

class MasterShiftCreate(_BaseSchema):
    """Request to create master shift."""
    master_id: int
    workers_count: int = Field(..., ge=0)
    shift_start_date: date
    shift_start_time: time
    shift_duration_hours: Decimal = Field(..., ge=0.5, le=24)


class MasterShiftUpdate(_BaseSchema):
    """Request to update master shift (limited fields)."""
    # Can't change: master_id, shift_start_date
    workers_count: Optional[int] = Field(None, ge=0)
    shift_start_time: Optional[time] = None
    shift_duration_hours: Optional[Decimal] = Field(None, ge=0.5, le=24)


class MasterShiftResponse(_BaseSchema):
    """Master shift response."""
    id: int
    master_id: int
    master_full_name: Optional[str] = None
    workers_count: int
    shift_start_date: date
    shift_start_time: time
    shift_start_at: Optional[datetime] = None
    shift_duration_hours: Decimal
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_deleted: bool = False


class MasterShiftSearchRequest(_BaseSchema):
    """Request to search for master shift by master_id and date."""
    master_id: int
    shift_start_date: date


class MasterShiftDeleteRequest(_BaseSchema):
    """Request to delete (soft) master shift."""
    delete_reason: str = Field(..., min_length=5, max_length=100)


# =============================================================================
# Summary Schemas (Сводка)
# =============================================================================

class SummaryEquipmentItem(_BaseSchema):
    """Single equipment item in summary."""
    equipment_type_id: int
    equipment_type_name: str
    count: int


class SummaryEquipmentGroup(_BaseSchema):
    """Group of equipment (own or rented) in summary."""
    is_own: bool
    label: str  # "Собственная" or "Арендованная"
    items: List[SummaryEquipmentItem]
    total: int


class SummaryEquipment(_BaseSchema):
    """Equipment summary section."""
    groups: List[SummaryEquipmentGroup]
    grand_total: int


class SummaryMasterItem(_BaseSchema):
    """Single master in summary."""
    master_id: int
    master_full_name: str
    workers_count: int


class SummaryPeople(_BaseSchema):
    """People (masters + workers) summary section."""
    masters: List[SummaryMasterItem]
    total_masters: int
    total_workers: int
    grand_total: int  # masters + workers


class SummaryResponse(_BaseSchema):
    """Full summary response."""
    date: date
    time_from: Optional[time] = None
    time_to: Optional[time] = None
    equipment: SummaryEquipment
    people: SummaryPeople


# =============================================================================
# Reference List Responses
# =============================================================================

class EquipmentTypesResponse(_BaseSchema):
    """List of equipment types."""
    items: List[EquipmentType]


class VehiclesResponse(_BaseSchema):
    """List of vehicles."""
    items: List[VehicleWithType]


class DriversResponse(_BaseSchema):
    """List of drivers."""
    items: List[Driver]


class MastersResponse(_BaseSchema):
    """List of masters."""
    items: List[Master]


class RentedPlateNumber(_BaseSchema):
    """Rented equipment plate number."""
    plate_number: str
    equipment_type_id: int
    equipment_type_name: Optional[str] = None


class RentedPlateNumbersResponse(_BaseSchema):
    """List of unique rented plate numbers."""
    items: List[RentedPlateNumber]


# =============================================================================
# Generic Response Wrappers
# =============================================================================

class MessageResponse(_BaseSchema):
    """Generic message response."""
    message: str
    success: bool = True

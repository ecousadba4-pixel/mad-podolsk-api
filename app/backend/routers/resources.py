"""Router for resources (учет техники и людей) endpoints."""

from typing import Optional
from datetime import date, time
from fastapi import APIRouter, Query, HTTPException, Depends

from app.backend.schemas.resources import (
    # Reference responses
    EquipmentTypesResponse,
    VehiclesResponse,
    DriversResponse,
    MastersResponse,
    RentedPlateNumbersResponse,
    # Equipment shift schemas
    EquipmentShiftCreate,
    EquipmentShiftUpdate,
    EquipmentShiftResponse,
    EquipmentShiftSearchRequest,
    EquipmentShiftDeleteRequest,
    # Master shift schemas
    MasterShiftCreate,
    MasterShiftUpdate,
    MasterShiftResponse,
    MasterShiftSearchRequest,
    MasterShiftDeleteRequest,
    # Summary
    SummaryResponse,
    # Generic
    MessageResponse,
)
from app.backend.services import resources_service
from app.backend.routers.auth import get_current_user


router = APIRouter()


# =============================================================================
# Reference Data Endpoints
# =============================================================================

@router.get("/references/equipment-types", response_model=EquipmentTypesResponse)
async def get_equipment_types():
    """Get list of active equipment types."""
    result = await resources_service.get_equipment_types()
    return EquipmentTypesResponse(**result)


@router.get("/references/vehicles", response_model=VehiclesResponse)
async def get_vehicles(
    equipment_type_id: Optional[int] = Query(None, description="Filter by equipment type"),
):
    """Get list of active vehicles, optionally filtered by equipment type."""
    result = await resources_service.get_vehicles(equipment_type_id=equipment_type_id)
    return VehiclesResponse(**result)


@router.get("/references/drivers", response_model=DriversResponse)
async def get_drivers():
    """Get list of active drivers."""
    result = await resources_service.get_drivers()
    return DriversResponse(**result)


@router.get("/references/masters", response_model=MastersResponse)
async def get_masters():
    """Get list of active masters."""
    result = await resources_service.get_masters()
    return MastersResponse(**result)


@router.get("/references/rented-plate-numbers", response_model=RentedPlateNumbersResponse)
async def get_rented_plate_numbers(
    equipment_type_id: Optional[int] = Query(None, description="Filter by equipment type"),
):
    """Get unique plate numbers from rented equipment shifts."""
    result = await resources_service.get_rented_plate_numbers(equipment_type_id=equipment_type_id)
    return RentedPlateNumbersResponse(**result)


# =============================================================================
# Equipment Shifts Endpoints
# =============================================================================

@router.post("/equipment-shifts", response_model=EquipmentShiftResponse)
async def create_equipment_shift(
    data: EquipmentShiftCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new equipment shift record."""
    user_id = current_user.get("id") if current_user else None
    
    result = await resources_service.create_equipment_shift(
        is_own=data.is_own,
        equipment_type_id=data.equipment_type_id,
        plate_number=data.plate_number,
        shift_start_date=data.shift_start_date,
        shift_start_time=data.shift_start_time,
        shift_duration_hours=data.shift_duration_hours,
        vehicle_id=data.vehicle_id,
        driver_id=data.driver_id,
        driver_name=data.driver_name,
        user_id=user_id,
    )
    return EquipmentShiftResponse(**result)


@router.post("/equipment-shifts/search", response_model=EquipmentShiftResponse)
async def search_equipment_shift(data: EquipmentShiftSearchRequest):
    """Search for equipment shift by plate number and date."""
    result = await resources_service.find_equipment_shift(
        plate_number=data.plate_number,
        shift_start_date=data.shift_start_date,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return EquipmentShiftResponse(**result)


@router.put("/equipment-shifts/{shift_id}", response_model=EquipmentShiftResponse)
async def update_equipment_shift(
    shift_id: int,
    data: EquipmentShiftUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update equipment shift (limited fields)."""
    user_id = current_user.get("id") if current_user else None
    
    result = await resources_service.update_equipment_shift(
        shift_id=shift_id,
        equipment_type_id=data.equipment_type_id,
        driver_id=data.driver_id,
        driver_name=data.driver_name,
        shift_start_time=data.shift_start_time,
        shift_duration_hours=data.shift_duration_hours,
        user_id=user_id,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return EquipmentShiftResponse(**result)


@router.delete("/equipment-shifts/{shift_id}", response_model=MessageResponse)
async def delete_equipment_shift(
    shift_id: int,
    data: EquipmentShiftDeleteRequest,
    current_user: dict = Depends(get_current_user),
):
    """Soft delete equipment shift."""
    user_id = current_user.get("id") if current_user else None
    
    result = await resources_service.delete_equipment_shift(
        shift_id=shift_id,
        delete_reason=data.delete_reason,
        user_id=user_id,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return MessageResponse(message="Запись успешно удалена")


# =============================================================================
# Master Shifts Endpoints
# =============================================================================

@router.post("/master-shifts", response_model=MasterShiftResponse)
async def create_master_shift(
    data: MasterShiftCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new master shift record."""
    user_id = current_user.get("id") if current_user else None
    
    result = await resources_service.create_master_shift(
        master_id=data.master_id,
        workers_count=data.workers_count,
        shift_start_date=data.shift_start_date,
        shift_start_time=data.shift_start_time,
        shift_duration_hours=data.shift_duration_hours,
        user_id=user_id,
    )
    return MasterShiftResponse(**result)


@router.post("/master-shifts/search", response_model=MasterShiftResponse)
async def search_master_shift(data: MasterShiftSearchRequest):
    """Search for master shift by master_id and date."""
    result = await resources_service.find_master_shift(
        master_id=data.master_id,
        shift_start_date=data.shift_start_date,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return MasterShiftResponse(**result)


@router.put("/master-shifts/{shift_id}", response_model=MasterShiftResponse)
async def update_master_shift(
    shift_id: int,
    data: MasterShiftUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update master shift (limited fields)."""
    user_id = current_user.get("id") if current_user else None
    
    result = await resources_service.update_master_shift(
        shift_id=shift_id,
        workers_count=data.workers_count,
        shift_start_time=data.shift_start_time,
        shift_duration_hours=data.shift_duration_hours,
        user_id=user_id,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return MasterShiftResponse(**result)


@router.delete("/master-shifts/{shift_id}", response_model=MessageResponse)
async def delete_master_shift(
    shift_id: int,
    data: MasterShiftDeleteRequest,
    current_user: dict = Depends(get_current_user),
):
    """Soft delete master shift."""
    user_id = current_user.get("id") if current_user else None
    
    result = await resources_service.delete_master_shift(
        shift_id=shift_id,
        delete_reason=data.delete_reason,
        user_id=user_id,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Запись не найдена")
    return MessageResponse(message="Запись успешно удалена")


# =============================================================================
# Summary Endpoint
# =============================================================================

@router.get("/summary", response_model=SummaryResponse)
async def get_summary(
    target_date: date = Query(..., alias="date", description="Target date for summary"),
    time_from: Optional[time] = Query(None, description="Filter time from (HH:MM)"),
    time_to: Optional[time] = Query(None, description="Filter time to (HH:MM)"),
):
    """Get summary of equipment and people for a given date/time range."""
    result = await resources_service.get_summary(
        target_date=target_date,
        time_from=time_from,
        time_to=time_to,
    )
    return SummaryResponse(**result)

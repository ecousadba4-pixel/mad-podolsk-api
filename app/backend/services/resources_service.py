"""Service for resources (учет техники и людей) section.

Handles business logic, validation, and change logging.
"""

from typing import Optional, Dict, List, Any
from datetime import date, time
from decimal import Decimal

from app.backend.repositories import resources_repo


# =============================================================================
# Reference Data
# =============================================================================

async def get_equipment_types() -> Dict[str, Any]:
    """Get list of active equipment types."""
    items = await resources_repo.get_equipment_types(active_only=True)
    return {"items": items}


async def get_vehicles(equipment_type_id: Optional[int] = None) -> Dict[str, Any]:
    """Get list of active vehicles, optionally filtered by type."""
    items = await resources_repo.get_vehicles_by_type(
        equipment_type_id=equipment_type_id,
        active_only=True,
    )
    return {"items": items}


async def get_drivers() -> Dict[str, Any]:
    """Get list of active drivers."""
    items = await resources_repo.get_drivers(active_only=True)
    return {"items": items}


async def get_masters() -> Dict[str, Any]:
    """Get list of active masters."""
    items = await resources_repo.get_masters(active_only=True)
    return {"items": items}


async def get_rented_plate_numbers(equipment_type_id: Optional[int] = None) -> Dict[str, Any]:
    """Get unique plate numbers from rented equipment shifts."""
    items = await resources_repo.get_rented_plate_numbers(equipment_type_id=equipment_type_id)
    return {"items": items}


# =============================================================================
# Equipment Shifts
# =============================================================================

async def create_equipment_shift(
    is_own: bool,
    equipment_type_id: int,
    plate_number: str,
    shift_start_date: date,
    shift_start_time: time,
    shift_duration_hours: Decimal,
    vehicle_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    driver_name: Optional[str] = None,
    user_id: Optional[int] = None,
) -> Dict[str, Any]:
    """Create a new equipment shift and log the change."""
    # Create the shift
    shift = await resources_repo.create_equipment_shift(
        is_own=is_own,
        equipment_type_id=equipment_type_id,
        plate_number=plate_number.upper().strip(),
        shift_start_date=shift_start_date,
        shift_start_time=shift_start_time,
        shift_duration_hours=shift_duration_hours,
        vehicle_id=vehicle_id,
        driver_id=driver_id,
        driver_name=driver_name,
        created_by=user_id,
    )
    
    # Log the creation
    await resources_repo.log_change(
        entity_name="equipment_shifts",
        entity_id=shift["id"],
        operation="INSERT",
        old_data=None,
        new_data=dict(shift),
        changed_by=user_id,
    )
    
    return shift


async def find_equipment_shift(
    plate_number: str,
    shift_start_date: date,
) -> Optional[Dict[str, Any]]:
    """Find equipment shift by plate number and date."""
    return await resources_repo.find_equipment_shift(
        plate_number=plate_number.upper().strip(),
        shift_start_date=shift_start_date,
        include_deleted=False,
    )


async def update_equipment_shift(
    shift_id: int,
    equipment_type_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    driver_name: Optional[str] = None,
    shift_start_time: Optional[time] = None,
    shift_duration_hours: Optional[Decimal] = None,
    user_id: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    """Update equipment shift and log the change."""
    # Get old data for logging
    old_shift = await resources_repo.get_equipment_shift_by_id(shift_id)
    if not old_shift or old_shift.get("is_deleted"):
        return None
    
    # Perform update
    new_shift = await resources_repo.update_equipment_shift(
        shift_id=shift_id,
        equipment_type_id=equipment_type_id,
        driver_id=driver_id,
        driver_name=driver_name,
        shift_start_time=shift_start_time,
        shift_duration_hours=shift_duration_hours,
        updated_by=user_id,
    )
    
    if new_shift:
        # Log the change
        await resources_repo.log_change(
            entity_name="equipment_shifts",
            entity_id=shift_id,
            operation="UPDATE",
            old_data=dict(old_shift),
            new_data=dict(new_shift),
            changed_by=user_id,
        )
    
    return new_shift


async def delete_equipment_shift(
    shift_id: int,
    delete_reason: str,
    user_id: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    """Soft delete equipment shift and log the change."""
    # Get old data for logging
    old_shift = await resources_repo.get_equipment_shift_by_id(shift_id)
    if not old_shift or old_shift.get("is_deleted"):
        return None
    
    # Perform soft delete
    deleted_shift = await resources_repo.soft_delete_equipment_shift(
        shift_id=shift_id,
        delete_reason=delete_reason,
        deleted_by=user_id,
    )
    
    if deleted_shift:
        # Log the change
        await resources_repo.log_change(
            entity_name="equipment_shifts",
            entity_id=shift_id,
            operation="DELETE",
            old_data=dict(old_shift),
            new_data=dict(deleted_shift),
            changed_by=user_id,
            comment=delete_reason,
        )
    
    return deleted_shift


# =============================================================================
# Master Shifts
# =============================================================================

async def create_master_shift(
    master_id: int,
    workers_count: int,
    shift_start_date: date,
    shift_start_time: time,
    shift_duration_hours: Decimal,
    user_id: Optional[int] = None,
) -> Dict[str, Any]:
    """Create a new master shift and log the change."""
    # Create the shift
    shift = await resources_repo.create_master_shift(
        master_id=master_id,
        workers_count=workers_count,
        shift_start_date=shift_start_date,
        shift_start_time=shift_start_time,
        shift_duration_hours=shift_duration_hours,
        created_by=user_id,
    )
    
    # Log the creation
    await resources_repo.log_change(
        entity_name="master_shifts",
        entity_id=shift["id"],
        operation="INSERT",
        old_data=None,
        new_data=dict(shift),
        changed_by=user_id,
    )
    
    return shift


async def find_master_shift(
    master_id: int,
    shift_start_date: date,
) -> Optional[Dict[str, Any]]:
    """Find master shift by master_id and date."""
    return await resources_repo.find_master_shift(
        master_id=master_id,
        shift_start_date=shift_start_date,
        include_deleted=False,
    )


async def update_master_shift(
    shift_id: int,
    workers_count: Optional[int] = None,
    shift_start_time: Optional[time] = None,
    shift_duration_hours: Optional[Decimal] = None,
    user_id: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    """Update master shift and log the change."""
    # Get old data for logging
    old_shift = await resources_repo.get_master_shift_by_id(shift_id)
    if not old_shift or old_shift.get("is_deleted"):
        return None
    
    # Perform update
    new_shift = await resources_repo.update_master_shift(
        shift_id=shift_id,
        workers_count=workers_count,
        shift_start_time=shift_start_time,
        shift_duration_hours=shift_duration_hours,
        updated_by=user_id,
    )
    
    if new_shift:
        # Log the change
        await resources_repo.log_change(
            entity_name="master_shifts",
            entity_id=shift_id,
            operation="UPDATE",
            old_data=dict(old_shift),
            new_data=dict(new_shift),
            changed_by=user_id,
        )
    
    return new_shift


async def delete_master_shift(
    shift_id: int,
    delete_reason: str,
    user_id: Optional[int] = None,
) -> Optional[Dict[str, Any]]:
    """Soft delete master shift and log the change."""
    # Get old data for logging
    old_shift = await resources_repo.get_master_shift_by_id(shift_id)
    if not old_shift or old_shift.get("is_deleted"):
        return None
    
    # Perform soft delete
    deleted_shift = await resources_repo.soft_delete_master_shift(
        shift_id=shift_id,
        delete_reason=delete_reason,
        deleted_by=user_id,
    )
    
    if deleted_shift:
        # Log the change
        await resources_repo.log_change(
            entity_name="master_shifts",
            entity_id=shift_id,
            operation="DELETE",
            old_data=dict(old_shift),
            new_data=dict(deleted_shift),
            changed_by=user_id,
            comment=delete_reason,
        )
    
    return deleted_shift


# =============================================================================
# Summary
# =============================================================================

async def get_summary(
    target_date: date,
    time_from: Optional[time] = None,
    time_to: Optional[time] = None,
) -> Dict[str, Any]:
    """Get full summary for equipment and people."""
    # Get equipment summary
    equipment_rows = await resources_repo.get_summary_equipment(
        target_date=target_date,
        time_from=time_from,
        time_to=time_to,
    )
    
    # Group equipment by is_own
    own_items = []
    rented_items = []
    
    for row in equipment_rows:
        item = {
            "equipment_type_id": row["equipment_type_id"],
            "equipment_type_name": row["equipment_type_name"] or "Без типа",
            "count": row["count"],
        }
        if row["is_own"]:
            own_items.append(item)
        else:
            rented_items.append(item)
    
    own_total = sum(item["count"] for item in own_items)
    rented_total = sum(item["count"] for item in rented_items)
    
    equipment_groups = []
    if own_items:
        equipment_groups.append({
            "is_own": True,
            "label": "Собственная",
            "items": own_items,
            "total": own_total,
        })
    if rented_items:
        equipment_groups.append({
            "is_own": False,
            "label": "Арендованная",
            "items": rented_items,
            "total": rented_total,
        })
    
    equipment_summary = {
        "groups": equipment_groups,
        "grand_total": own_total + rented_total,
    }
    
    # Get people summary
    people_rows = await resources_repo.get_summary_people(
        target_date=target_date,
        time_from=time_from,
        time_to=time_to,
    )
    
    masters_list = [
        {
            "master_id": row["master_id"],
            "master_full_name": row["master_full_name"] or "Без имени",
            "workers_count": row["workers_count"],
        }
        for row in people_rows
    ]
    
    total_masters = len(masters_list)
    total_workers = sum(m["workers_count"] for m in masters_list)
    
    people_summary = {
        "masters": masters_list,
        "total_masters": total_masters,
        "total_workers": total_workers,
        "grand_total": total_masters + total_workers,
    }
    
    return {
        "date": target_date,
        "time_from": time_from,
        "time_to": time_to,
        "equipment": equipment_summary,
        "people": people_summary,
    }

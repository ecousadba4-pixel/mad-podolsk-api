"""Repository for resources (учет техники и людей) data access."""

from typing import Optional, List, Dict, Any
from datetime import date, time, datetime
from decimal import Decimal
import json

from app.backend import db_resources as db


# =============================================================================
# Reference Data (Справочники)
# =============================================================================

async def get_equipment_types(active_only: bool = True) -> List[dict]:
    """Get list of equipment types."""
    condition = "WHERE is_active = true" if active_only else ""
    return await db.query_async(
        f"""
        SELECT id, name, is_active
        FROM equipment_types
        {condition}
        ORDER BY name
        """
    )


async def get_vehicles_by_type(equipment_type_id: Optional[int] = None, active_only: bool = True) -> List[dict]:
    """Get list of vehicles, optionally filtered by equipment type."""
    conditions = []
    params = []
    
    if active_only:
        conditions.append("v.is_active = true")
    
    if equipment_type_id is not None:
        conditions.append("v.equipment_type_id = %s")
        params.append(equipment_type_id)
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    return await db.query_async(
        f"""
        SELECT 
            v.id,
            v.equipment_type_id,
            et.name AS equipment_type_name,
            v.plate_number,
            v.is_active
        FROM vehicles v
        LEFT JOIN equipment_types et ON v.equipment_type_id = et.id
        WHERE {where_clause}
        ORDER BY v.plate_number
        """,
        tuple(params),
    )


async def get_drivers(active_only: bool = True) -> List[dict]:
    """Get list of drivers."""
    condition = "WHERE is_active = true" if active_only else ""
    return await db.query_async(
        f"""
        SELECT id, full_name, phone, is_active
        FROM drivers
        {condition}
        ORDER BY full_name
        """
    )


async def get_masters(active_only: bool = True) -> List[dict]:
    """Get list of masters."""
    condition = "WHERE is_active = true" if active_only else ""
    return await db.query_async(
        f"""
        SELECT id, full_name, phone, is_active
        FROM masters
        {condition}
        ORDER BY full_name
        """
    )


async def get_rented_plate_numbers(equipment_type_id: Optional[int] = None) -> List[dict]:
    """Get unique plate numbers from rented equipment shifts (is_own = false).
    
    Returns list of unique plate numbers with equipment type info.
    """
    conditions = ["es.is_own = false", "es.is_deleted = false"]
    params = []
    
    if equipment_type_id is not None:
        conditions.append("es.equipment_type_id = %s")
        params.append(equipment_type_id)
    
    where_clause = " AND ".join(conditions)
    
    return await db.query_async(
        f"""
        SELECT DISTINCT ON (es.plate_number)
            es.plate_number,
            es.equipment_type_id,
            et.name AS equipment_type_name
        FROM equipment_shifts es
        LEFT JOIN equipment_types et ON es.equipment_type_id = et.id
        WHERE {where_clause}
        ORDER BY es.plate_number
        """,
        tuple(params) if params else None,
    )


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
    created_by: Optional[int] = None,
) -> dict:
    """Create a new equipment shift record."""
    # Compute shift_start_at
    shift_start_at = datetime.combine(shift_start_date, shift_start_time)
    
    result = await db.query_one_async(
        """
        INSERT INTO equipment_shifts (
            is_own, vehicle_id, equipment_type_id, plate_number,
            driver_id, driver_name,
            shift_start_date, shift_start_time, shift_start_at, shift_duration_hours,
            created_by, updated_by
        ) VALUES (
            %s, %s, %s, %s,
            %s, %s,
            %s, %s, %s, %s,
            %s, %s
        )
        RETURNING *
        """,
        (
            is_own, vehicle_id, equipment_type_id, plate_number,
            driver_id, driver_name,
            shift_start_date, shift_start_time, shift_start_at, shift_duration_hours,
            created_by, created_by,
        ),
    )
    return result


async def find_equipment_shift(
    plate_number: str,
    shift_start_date: date,
    include_deleted: bool = False,
) -> Optional[dict]:
    """Find equipment shift by plate number and date."""
    deleted_condition = "" if include_deleted else "AND is_deleted = false"
    
    return await db.query_one_async(
        f"""
        SELECT 
            es.*,
            et.name AS equipment_type_name
        FROM equipment_shifts es
        LEFT JOIN equipment_types et ON es.equipment_type_id = et.id
        WHERE es.plate_number = %s 
          AND es.shift_start_date = %s
          {deleted_condition}
        ORDER BY es.created_at DESC
        LIMIT 1
        """,
        (plate_number, shift_start_date),
    )


async def get_equipment_shift_by_id(shift_id: int) -> Optional[dict]:
    """Get equipment shift by ID."""
    return await db.query_one_async(
        """
        SELECT 
            es.*,
            et.name AS equipment_type_name
        FROM equipment_shifts es
        LEFT JOIN equipment_types et ON es.equipment_type_id = et.id
        WHERE es.id = %s
        """,
        (shift_id,),
    )


async def update_equipment_shift(
    shift_id: int,
    equipment_type_id: Optional[int] = None,
    driver_id: Optional[int] = None,
    driver_name: Optional[str] = None,
    shift_start_time: Optional[time] = None,
    shift_duration_hours: Optional[Decimal] = None,
    updated_by: Optional[int] = None,
) -> Optional[dict]:
    """Update equipment shift (only allowed fields)."""
    updates = []
    params = []
    
    if equipment_type_id is not None:
        updates.append("equipment_type_id = %s")
        params.append(equipment_type_id)
    
    if driver_id is not None:
        updates.append("driver_id = %s")
        params.append(driver_id)
    
    if driver_name is not None:
        updates.append("driver_name = %s")
        params.append(driver_name)
    
    if shift_start_time is not None:
        updates.append("shift_start_time = %s")
        params.append(shift_start_time)
    
    if shift_duration_hours is not None:
        updates.append("shift_duration_hours = %s")
        params.append(shift_duration_hours)
    
    if not updates:
        return await get_equipment_shift_by_id(shift_id)
    
    updates.append("updated_at = now()")
    if updated_by is not None:
        updates.append("updated_by = %s")
        params.append(updated_by)
    
    set_clause = ", ".join(updates)
    params.append(shift_id)
    
    return await db.query_one_async(
        f"""
        UPDATE equipment_shifts
        SET {set_clause}
        WHERE id = %s AND is_deleted = false
        RETURNING *
        """,
        tuple(params),
    )


async def soft_delete_equipment_shift(
    shift_id: int,
    delete_reason: str,
    deleted_by: Optional[int] = None,
) -> Optional[dict]:
    """Soft delete equipment shift."""
    return await db.query_one_async(
        """
        UPDATE equipment_shifts
        SET 
            is_deleted = true,
            deleted_at = now(),
            deleted_by = %s,
            delete_reason = %s,
            updated_at = now(),
            updated_by = %s
        WHERE id = %s AND is_deleted = false
        RETURNING *
        """,
        (deleted_by, delete_reason, deleted_by, shift_id),
    )


# =============================================================================
# Master Shifts
# =============================================================================

async def create_master_shift(
    master_id: int,
    workers_count: int,
    shift_start_date: date,
    shift_start_time: time,
    shift_duration_hours: Decimal,
    created_by: Optional[int] = None,
) -> dict:
    """Create a new master shift record."""
    # Compute shift_start_at
    shift_start_at = datetime.combine(shift_start_date, shift_start_time)
    
    result = await db.query_one_async(
        """
        INSERT INTO master_shifts (
            master_id, workers_count,
            shift_start_date, shift_start_time, shift_start_at, shift_duration_hours,
            created_by, updated_by
        ) VALUES (
            %s, %s,
            %s, %s, %s, %s,
            %s, %s
        )
        RETURNING *
        """,
        (
            master_id, workers_count,
            shift_start_date, shift_start_time, shift_start_at, shift_duration_hours,
            created_by, created_by,
        ),
    )
    return result


async def find_master_shift(
    master_id: int,
    shift_start_date: date,
    include_deleted: bool = False,
) -> Optional[dict]:
    """Find master shift by master_id and date."""
    deleted_condition = "" if include_deleted else "AND ms.is_deleted = false"
    
    return await db.query_one_async(
        f"""
        SELECT 
            ms.*,
            m.full_name AS master_full_name
        FROM master_shifts ms
        LEFT JOIN masters m ON ms.master_id = m.id
        WHERE ms.master_id = %s 
          AND ms.shift_start_date = %s
          {deleted_condition}
        ORDER BY ms.created_at DESC
        LIMIT 1
        """,
        (master_id, shift_start_date),
    )


async def get_master_shift_by_id(shift_id: int) -> Optional[dict]:
    """Get master shift by ID."""
    return await db.query_one_async(
        """
        SELECT 
            ms.*,
            m.full_name AS master_full_name
        FROM master_shifts ms
        LEFT JOIN masters m ON ms.master_id = m.id
        WHERE ms.id = %s
        """,
        (shift_id,),
    )


async def update_master_shift(
    shift_id: int,
    workers_count: Optional[int] = None,
    shift_start_time: Optional[time] = None,
    shift_duration_hours: Optional[Decimal] = None,
    updated_by: Optional[int] = None,
) -> Optional[dict]:
    """Update master shift (only allowed fields)."""
    updates = []
    params = []
    
    if workers_count is not None:
        updates.append("workers_count = %s")
        params.append(workers_count)
    
    if shift_start_time is not None:
        updates.append("shift_start_time = %s")
        params.append(shift_start_time)
    
    if shift_duration_hours is not None:
        updates.append("shift_duration_hours = %s")
        params.append(shift_duration_hours)
    
    if not updates:
        return await get_master_shift_by_id(shift_id)
    
    updates.append("updated_at = now()")
    if updated_by is not None:
        updates.append("updated_by = %s")
        params.append(updated_by)
    
    set_clause = ", ".join(updates)
    params.append(shift_id)
    
    return await db.query_one_async(
        f"""
        UPDATE master_shifts
        SET {set_clause}
        WHERE id = %s AND is_deleted = false
        RETURNING *
        """,
        tuple(params),
    )


async def soft_delete_master_shift(
    shift_id: int,
    delete_reason: str,
    deleted_by: Optional[int] = None,
) -> Optional[dict]:
    """Soft delete master shift."""
    return await db.query_one_async(
        """
        UPDATE master_shifts
        SET 
            is_deleted = true,
            deleted_at = now(),
            deleted_by = %s,
            delete_reason = %s,
            updated_at = now(),
            updated_by = %s
        WHERE id = %s AND is_deleted = false
        RETURNING *
        """,
        (deleted_by, delete_reason, deleted_by, shift_id),
    )


# =============================================================================
# Summary Queries
# =============================================================================

async def get_summary_equipment(
    target_date: date,
    time_from: Optional[time] = None,
    time_to: Optional[time] = None,
) -> List[dict]:
    """Get equipment summary for a given date/time range.
    
    Returns counts grouped by is_own and equipment_type_id.
    """
    # Build time filter condition
    time_conditions = []
    params: List[Any] = [target_date]
    
    if time_from is not None and time_to is not None:
        # Filter shifts that overlap with the time range
        time_conditions.append("""
            AND shift_start_time <= %s
            AND (shift_start_time + (shift_duration_hours * interval '1 hour'))::time >= %s
        """)
        params.extend([time_to, time_from])
    
    time_filter = " ".join(time_conditions)
    
    return await db.query_async(
        f"""
        SELECT 
            es.is_own,
            es.equipment_type_id,
            et.name AS equipment_type_name,
            COUNT(*) AS count
        FROM equipment_shifts es
        LEFT JOIN equipment_types et ON es.equipment_type_id = et.id
        WHERE es.shift_start_date = %s
          AND es.is_deleted = false
          {time_filter}
        GROUP BY es.is_own, es.equipment_type_id, et.name
        ORDER BY es.is_own DESC, et.name
        """,
        tuple(params),
    )


async def get_summary_people(
    target_date: date,
    time_from: Optional[time] = None,
    time_to: Optional[time] = None,
) -> List[dict]:
    """Get people (masters + workers) summary for a given date/time range.
    
    Returns list of masters with their workers count.
    """
    # Build time filter condition
    time_conditions = []
    params: List[Any] = [target_date]
    
    if time_from is not None and time_to is not None:
        time_conditions.append("""
            AND shift_start_time <= %s
            AND (shift_start_time + (shift_duration_hours * interval '1 hour'))::time >= %s
        """)
        params.extend([time_to, time_from])
    
    time_filter = " ".join(time_conditions)
    
    return await db.query_async(
        f"""
        SELECT 
            ms.master_id,
            m.full_name AS master_full_name,
            ms.workers_count
        FROM master_shifts ms
        LEFT JOIN masters m ON ms.master_id = m.id
        WHERE ms.shift_start_date = %s
          AND ms.is_deleted = false
          {time_filter}
        ORDER BY m.full_name
        """,
        tuple(params),
    )


# =============================================================================
# Change Log
# =============================================================================

def _serialize_for_json(obj: Any) -> Any:
    """Convert non-JSON-serializable types for JSON storage."""
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, time):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    return obj


def _dict_to_json(data: Optional[dict]) -> Optional[str]:
    """Convert dict to JSON string, handling special types."""
    if data is None:
        return None
    serializable = {k: _serialize_for_json(v) for k, v in data.items()}
    return json.dumps(serializable, ensure_ascii=False)


async def log_change(
    entity_name: str,
    entity_id: int,
    operation: str,
    old_data: Optional[dict] = None,
    new_data: Optional[dict] = None,
    changed_by: Optional[int] = None,
    comment: Optional[str] = None,
) -> dict:
    """Log a change to change_log table."""
    return await db.query_one_async(
        """
        INSERT INTO change_log (
            entity_name, entity_id, operation,
            old_data, new_data,
            changed_by, comment
        ) VALUES (
            %s, %s, %s,
            %s::jsonb, %s::jsonb,
            %s, %s
        )
        RETURNING *
        """,
        (
            entity_name, entity_id, operation,
            _dict_to_json(old_data), _dict_to_json(new_data),
            changed_by, comment,
        ),
    )

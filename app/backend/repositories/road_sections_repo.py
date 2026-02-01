"""Repository for road sections data access."""

from typing import Optional, List

from app.backend import db


async def get_road_sections(search: Optional[str] = None) -> List[dict]:
    """
    Get road sections with optional search filter.
    """
    conditions = []
    params = []
    
    if search and len(search) >= 3:
        conditions.append("road_section_name ILIKE %s")
        params.append(f"%{search}%")
    
    where_clause = " AND ".join(conditions) if conditions else "1=1"
    
    return await db.query_async(
        f"""
        SELECT 
            road_section_id,
            road_section_name,
            length_km,
            width_m,
            passport_volume,
            sidewalk_passport_volume
        FROM dim_road_section
        WHERE {where_clause}
        ORDER BY road_section_name
        """,
        tuple(params),
    )

"""Service for road sections section."""

from typing import Optional, Dict

from app.backend.repositories import road_sections_repo


async def get_road_sections(search: Optional[str] = None) -> Dict:
    """Get list of road sections with optional search."""
    rows = await road_sections_repo.get_road_sections(search)
    return {
        "rows": rows,
        "total": len(rows),
    }

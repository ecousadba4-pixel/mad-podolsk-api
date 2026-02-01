"""Router for road sections (участки дороги) endpoints."""

from typing import Optional
from fastapi import APIRouter, Query

from app.backend.schemas.road_sections import RoadSectionsListResponse
from app.backend.services import road_sections_service


router = APIRouter()


@router.get("", response_model=RoadSectionsListResponse)
async def get_road_sections(
    search: Optional[str] = Query(None, description="Search by road section name (min 3 chars)"),
):
    """
    Get list of road sections with optional search.
    Search is triggered when at least 3 characters are provided.
    """
    result = await road_sections_service.get_road_sections(search)
    return RoadSectionsListResponse(**result)

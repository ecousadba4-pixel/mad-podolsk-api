"""Schemas for road sections (участки дороги) section."""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class _BaseSchema(BaseModel):
    """Base schema with optimized serialization settings."""
    model_config = ConfigDict(
        extra="ignore",
        from_attributes=True,
        ser_json_inf_nan="constants",
    )


class RoadSectionRow(_BaseSchema):
    """Single road section row."""
    road_section_id: int
    road_section_name: Optional[str]
    length_km: Optional[float]
    passport_volume: Optional[float]
    sidewalk_passport_volume: Optional[float]


class RoadSectionsListResponse(_BaseSchema):
    """Response with list of road sections."""
    rows: List[RoadSectionRow]
    total: int

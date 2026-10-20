from datetime import datetime
from typing import Optional

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict, Field


class BuildingBase(BaseModel):
    """
    Base model containing building information.
    """

    building_id: str = Field(
        ...,
        min_length=1,
        max_length=50,
        examples=["Building-A"],
        description="Unique building identifier"
    )

    building_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        examples=["AI Research Block"],
        description="Building name"
    )

    total_floors: int = Field(
        ...,
        ge=1,
        examples=[3],
        description="Total number of floors"
    )

    location: str = Field(
        ...,
        min_length=2,
        max_length=150,
        examples=["Chennai, India"],
        description="Building location"
    )

    description: Optional[str] = Field(
        default=None,
        examples=["Smart building used for Digital Twin research"],
        description="Additional building description"
    )

    status: str = Field(
        default="Active",
        examples=["Active"],
        description="Current building status"
    )


class BuildingCreate(BuildingBase):
    """
    Request model for creating a building.
    """
    pass


class BuildingUpdate(BaseModel):
    """
    Request model for updating building information.
    """

    building_name: Optional[str] = None
    total_floors: Optional[int] = Field(default=None, ge=1)
    location: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class BuildingResponse(BuildingBase):
    """
    Response model returned to clients.
    """

    id: str

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
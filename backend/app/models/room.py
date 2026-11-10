from datetime import datetime
from typing import Optional

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict, Field


class RoomBase(BaseModel):
    """
    Base model containing common room information.
    """

    building_id: str = Field(
        ...,
        min_length=1,
        max_length=50,
        examples=["Building-A"],
        description="Unique building identifier"
    )

    floor_number: int = Field(
        ...,
        ge=1,
        examples=[1],
        description="Floor number where the room is located"
    )

    room_id: str = Field(
        ...,
        min_length=1,
        max_length=30,
        examples=["Room-101"],
        description="Unique room identifier"
    )

    room_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        examples=["Conference Room"],
        description="Room name"
    )

    room_type: str = Field(
        ...,
        examples=["Meeting Room"],
        description="Type of room"
    )

    x_coordinate: float = Field(
        ...,
        ge=0,
        examples=[100],
        description="Room X position in 2D layout"
    )

    y_coordinate: float = Field(
        ...,
        ge=0,
        examples=[80],
        description="Room Y position in 2D layout"
    )

    width: float = Field(
        ...,
        ge=0,
        examples=[150],
        description="Room width"
    )

    height: float = Field(
        ...,
        ge=0,
        examples=[120],
        description="Room height"
    )

    status: str = Field(
        default="Normal",
        examples=["Normal"],
        description="Current room status"
    )


class RoomCreate(RoomBase):
    """
    Request model used when creating a room.
    """
    pass


class RoomUpdate(BaseModel):
    """
    Request model used for updating room information.
    """

    room_name: Optional[str] = None
    room_type: Optional[str] = None
    x_coordinate: Optional[float] = None
    y_coordinate: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    status: Optional[str] = None


class RoomResponse(RoomBase):
    """
    Response model returned to clients.
    """

    id: str

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DashboardRoomResponse(RoomResponse):
    """
    Response model for Dashboard Rooms.

    Includes latest sensor values and AI prediction results.
    """

    # Latest sensor values
    temperature: float | None = None
    humidity: float | None = None
    gas_level: float | None = None
    motion_detected: bool = False

    # AI occupancy prediction
    prediction: str | None = None
    confidence: float | None = None

    # AI safety analysis
    risk_score: int = 0
    reasons: list[str] = []
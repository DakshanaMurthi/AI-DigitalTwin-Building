from typing import List

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, Path, status

from app.models.room import (
    RoomCreate,
    RoomResponse,
    RoomUpdate,
    DashboardRoomResponse,
)
from app.models.response import SuccessResponse
from app.services.room_service import RoomService
from app.utils.logger import logger

router = APIRouter()

room_service = RoomService()


@router.post(
    "/",
    response_model=SuccessResponse[RoomResponse],
    status_code=status.HTTP_201_CREATED
)
async def create_room(room: RoomCreate):
    """Create a new room."""
    try:
        created_room = await room_service.create_room(room)

        return SuccessResponse(
            success=True,
            message="Room created successfully.",
            data=created_room
        )

    except Exception as e:
        logger.error(f"Create Room Error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to create room."
        )


@router.get(
    "/",
    response_model=SuccessResponse[List[RoomResponse]]
)
async def get_all_rooms():
    """Retrieve all rooms."""
    try:
        rooms = await room_service.get_all_rooms()

        return SuccessResponse(
            success=True,
            message="Rooms retrieved successfully.",
            data=rooms
        )

    except Exception as e:
        logger.error(f"Get Rooms Error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve rooms."
        )
@router.get(
    "/dashboard",
    response_model=SuccessResponse[List[DashboardRoomResponse]]
)
async def get_dashboard_rooms():
    """
    Retrieve all rooms with latest sensor values.
    """
    try:
        rooms = await room_service.get_dashboard_rooms()

        return SuccessResponse(
            success=True,
            message="Dashboard rooms retrieved successfully.",
            data=rooms,
        )

    except Exception as e:
        logger.error(f"Dashboard Rooms Error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve dashboard rooms.",
        )
@router.get(
    "/{room_id}",
    response_model=SuccessResponse[RoomResponse]
)
async def get_room(
    room_id: str = Path(..., description="Room ID")
):
    """Retrieve a room by Room ID."""

    room = await room_service.get_room_by_id(room_id)

    if room is None:
        raise HTTPException(
            status_code=404,
            detail=f"Room '{room_id}' not found."
        )

    return SuccessResponse(
        success=True,
        message="Room retrieved successfully.",
        data=room
    )


@router.put(
    "/{room_id}",
    response_model=SuccessResponse[RoomResponse]
)
async def update_room(
    room_id: str = Path(..., description="Room ID"),
    room: RoomUpdate = ...
):
    """Update room."""

    updated_room = await room_service.update_room(
        room_id,
        room
    )

    if updated_room is None:
        raise HTTPException(
            status_code=404,
            detail=f"Room '{room_id}' not found."
        )

    return SuccessResponse(
        success=True,
        message="Room updated successfully.",
        data=updated_room
    )


@router.delete(
    "/{room_id}",
    response_model=SuccessResponse[dict]
)
async def delete_room(
    room_id: str = Path(..., description="Room ID")
):
    """Delete room."""

    deleted = await room_service.delete_room(room_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail=f"Room '{room_id}' not found."
        )

    return SuccessResponse(
        success=True,
        message="Room deleted successfully.",
        data={
            "room_id": room_id
        }
    )


@router.get(
    "/floor/{floor_number}",
    response_model=SuccessResponse[List[RoomResponse]]
)
async def get_rooms_by_floor(
    floor_number: int = Path(..., ge=1, description="Floor Number")
):
    """Retrieve all rooms on a floor."""

    rooms = await room_service.get_rooms_by_floor(floor_number)

    return SuccessResponse(
        success=True,
        message=f"Rooms on Floor {floor_number} retrieved successfully.",
        data=rooms
    )
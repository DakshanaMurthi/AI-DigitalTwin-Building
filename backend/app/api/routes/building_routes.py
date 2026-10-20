from typing import List

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status

from app.models.building import (
    BuildingCreate,
    BuildingUpdate,
    BuildingResponse,
)
from app.models.response import SuccessResponse
from app.services.building_service import BuildingService
from app.utils.logger import logger

router = APIRouter()

building_service = BuildingService()


@router.post(
    "/",
    response_model=SuccessResponse[BuildingResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_building(building: BuildingCreate):
    """
    Create a new building.
    """
    try:
        result = await building_service.create_building(building)

        return SuccessResponse(
            success=True,
            message="Building created successfully.",
            data=result,
        )

    except Exception as e:
        logger.error(f"Create Building Error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to create building.",
        )


@router.get(
    "/",
    response_model=SuccessResponse[List[BuildingResponse]],
)
async def get_all_buildings():
    """
    Get all buildings.
    """
    try:
        buildings = await building_service.get_all_buildings()

        return SuccessResponse(
            success=True,
            message="Buildings retrieved successfully.",
            data=buildings,
        )

    except Exception as e:
        logger.error(f"Get Buildings Error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve buildings.",
        )


@router.get(
    "/{building_id}",
    response_model=SuccessResponse[BuildingResponse],
)
async def get_building(building_id: str):
    """
    Get a building by ID.
    """
    try:
        building = await building_service.get_building_by_id(building_id)

        if not building:
            raise HTTPException(
                status_code=404,
                detail=f"Building '{building_id}' not found.",
            )

        return SuccessResponse(
            success=True,
            message="Building retrieved successfully.",
            data=building,
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Get Building Error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve building.",
        )


@router.put(
    "/{building_id}",
    response_model=SuccessResponse[BuildingResponse],
)
async def update_building(
    building_id: str,
    building: BuildingUpdate,
):
    """
    Update building information.
    """
    try:
        updated = await building_service.update_building(
            building_id,
            building,
        )

        if not updated:
            raise HTTPException(
                status_code=404,
                detail=f"Building '{building_id}' not found.",
            )

        return SuccessResponse(
            success=True,
            message="Building updated successfully.",
            data=updated,
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Update Building Error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to update building.",
        )


@router.delete(
    "/{building_id}",
    response_model=SuccessResponse[dict],
)
async def delete_building(building_id: str):
    """
    Delete building.
    """
    try:
        deleted = await building_service.delete_building(building_id)

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail=f"Building '{building_id}' not found.",
            )

        return SuccessResponse(
            success=True,
            message="Building deleted successfully.",
            data={"building_id": building_id},
        )

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Delete Building Error: {e}")

        raise HTTPException(
            status_code=500,
            detail="Failed to delete building.",
        )
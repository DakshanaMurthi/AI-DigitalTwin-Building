# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status

from app.models.response import SuccessResponse
from app.models.settings import (
    SettingsResponse,
    SettingsUpdate,
)
from app.services.settings_service import settings_service
from app.utils.logger import logger


router = APIRouter(
    prefix="/settings",
    tags=["Settings"],
)


@router.get(
    "",
    response_model=SuccessResponse[SettingsResponse],
    status_code=status.HTTP_200_OK,
)
async def get_settings():
    """
    Get current building and monitoring configuration.
    """

    logger.info("GET /settings")

    try:
        settings = await settings_service.get_settings()

        return SuccessResponse(
            success=True,
            message="Settings retrieved successfully.",
            data=settings,
        )

    except Exception as e:
        logger.exception(f"Settings GET Error: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load settings.",
        )


@router.put(
    "",
    response_model=SuccessResponse[SettingsResponse],
    status_code=status.HTTP_200_OK,
)
async def update_settings(
    settings: SettingsUpdate,
):
    """
    Update building and monitoring configuration.
    """

    logger.info("PUT /settings")

    try:
        updated_settings = (
            await settings_service.update_settings(
                settings
            )
        )

        return SuccessResponse(
            success=True,
            message="Settings saved successfully.",
            data=updated_settings,
        )

    except Exception as e:
        logger.exception(f"Settings PUT Error: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save settings.",
        )
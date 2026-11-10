# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status

from app.models.dashboard import DashboardOverview
from app.models.response import SuccessResponse
from app.services.dashboard_service import DashboardService
from app.utils.logger import logger

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

dashboard_service = DashboardService()


@router.get(
    "/overview",
    response_model=SuccessResponse[DashboardOverview],
    status_code=status.HTTP_200_OK,
)
async def get_dashboard_overview():
    """
    Get complete dashboard overview.
    """

    logger.info("GET /dashboard/overview")

    try:
        dashboard = await dashboard_service.get_dashboard_overview()

        return SuccessResponse[DashboardOverview](
            success=True,
            message="Dashboard overview retrieved successfully.",
            data=dashboard,
        )

    except Exception as e:
        logger.exception(f"Dashboard Error: {e}")

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to load dashboard overview.",
        )
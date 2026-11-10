# pyrefly: ignore [missing-import]
from fastapi import APIRouter
# pyrefly: ignore [missing-import]
from fastapi import HTTPException
# pyrefly: ignore [missing-import]
from fastapi import status

from app.models.occupancy_count import OccupancyCountResponse
from app.models.response import SuccessResponse
from app.services.occupancy_count_service import OccupancyCountService

router = APIRouter(
    prefix="/occupancy",
    tags=["Occupancy Count"],
)

service = OccupancyCountService()


@router.get(
    "/{room_id}",
    response_model=SuccessResponse[OccupancyCountResponse],
    status_code=status.HTTP_200_OK,
)
async def predict_occupancy(room_id: str):

    result = await service.predict(room_id)

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Sensor data not found.",
        )

    return SuccessResponse(
        success=True,
        message="Occupancy count predicted successfully.",
        data=OccupancyCountResponse(**result),
    )
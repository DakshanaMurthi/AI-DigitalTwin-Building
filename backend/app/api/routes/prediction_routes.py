# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status

from app.models.ai_prediction import PredictionResponse
from app.models.response import SuccessResponse
from app.services.prediction_service import PredictionService
from app.utils.logger import logger

router = APIRouter(
    prefix="/prediction",
    tags=["AI Prediction"],
)

prediction_service = PredictionService()


@router.get(
    "/{room_id}",
    response_model=SuccessResponse[PredictionResponse],
    status_code=status.HTTP_200_OK,
)
async def predict_room(room_id: str):
    """
    Predict room occupancy using trained ML model.
    """

    logger.info(f"Prediction Request : {room_id}")

    prediction = await prediction_service.predict_room_status(room_id)

    if prediction is None:
        raise HTTPException(
            status_code=404,
            detail=f"No sensor data found for room '{room_id}'.",
        )

    return SuccessResponse(
        success=True,
        message="Prediction generated successfully.",
        data=PredictionResponse(**prediction),
    )
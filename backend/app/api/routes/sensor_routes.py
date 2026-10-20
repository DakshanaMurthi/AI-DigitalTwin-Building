from typing import List

from fastapi import APIRouter, HTTPException, status

from app.models.sensor import (
    SensorDataCreate,
    SensorDataResponse,
)

from app.models.response import SuccessResponse

from app.services.sensor_service import SensorService
from app.services.prediction_service import PredictionService

from app.utils.logger import logger

from app.websocket.manager import manager


router = APIRouter()


sensor_service = SensorService()
prediction_service = PredictionService()


# ============================================================
# CREATE SENSOR DATA
# ============================================================

@router.post(
    "/",
    response_model=SuccessResponse[SensorDataResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_sensor_data(
    sensor: SensorDataCreate,
):

    logger.info(
        "========== POST /sensor-data RECEIVED =========="
    )

    logger.info(
        f"Received sensor data: {sensor.model_dump()}"
    )

    try:

        # ----------------------------------------------------
        # 1. STORE RAW SENSOR DATA
        # ----------------------------------------------------

        sensor_data = await sensor_service.create_sensor_data(
            sensor
        )

        logger.info(
            f"Sensor data stored successfully | "
            f"ID={sensor_data.id} | "
            f"Room={sensor_data.room_id}"
        )

        # ----------------------------------------------------
        # 2. RUN AI / ML ANALYSIS
        # ----------------------------------------------------

        ai_result = (
            await prediction_service.predict_room_status(
                sensor_data.room_id
            )
        )

        # ----------------------------------------------------
        # 3. FALLBACK
        # ----------------------------------------------------

        if ai_result is None:

            operational_occupancy = (
                "Occupied"
                if sensor_data.motion_detected
                else "Vacant"
            )

            ai_result = {

                "room_id": sensor_data.room_id,

                "prediction": operational_occupancy,

                "occupancy_source": "PIR sensor",

                "motion_detected":
                    sensor_data.motion_detected,

                "ml_prediction": None,

                "ml_confidence": None,

                "confidence": None,

                "ml_model": None,

                "temperature":
                    sensor_data.temperature,

                "humidity":
                    sensor_data.humidity,

                "gas_level":
                    sensor_data.gas_level,

                "status": "Normal",

                "risk_score": 0,

                "reasons": [],

                "suggested_action":
                    "Room conditions are normal. "
                    "Continue monitoring.",

                "normalized_features": {},
            }

        # ----------------------------------------------------
        # 4. EXTRACT OCCUPANCY
        # ----------------------------------------------------

        occupancy = ai_result.get(
            "prediction"
        )

        if occupancy is None:

            occupancy = (
                "Occupied"
                if sensor_data.motion_detected
                else "Vacant"
            )

        # ----------------------------------------------------
        # 5. CREATE WEBSOCKET MESSAGE
        # ----------------------------------------------------

        websocket_message = {

            "type":
                "sensor_update",

            "room_id":
                sensor_data.room_id,

            "temperature":
                sensor_data.temperature,

            "humidity":
                sensor_data.humidity,

            "gas_level":
                sensor_data.gas_level,

            "motion_detected":
                sensor_data.motion_detected,

            # Operational occupancy
            "occupancy":
                occupancy,

            "prediction":
                occupancy,

            "occupancy_source":
                ai_result.get(
                    "occupancy_source",
                    "PIR sensor",
                ),

            # ML information
            "ml_prediction":
                ai_result.get(
                    "ml_prediction"
                ),

            "ml_confidence":
                ai_result.get(
                    "ml_confidence",
                    ai_result.get("confidence"),
                ),

            "confidence":
                ai_result.get(
                    "confidence",
                    ai_result.get("ml_confidence"),
                ),

            "ml_model":
                ai_result.get(
                    "ml_model"
                ),

            # AI anomaly information
            "status":
                ai_result.get(
                    "status",
                    "Normal",
                ),

            "risk_score":
                ai_result.get(
                    "risk_score",
                    0,
                ),

            "reasons":
                ai_result.get(
                    "reasons",
                    [],
                ),

            "suggested_action":
                ai_result.get(
                    "suggested_action"
                ),

            "normalized_features":
                ai_result.get(
                    "normalized_features",
                    {},
                ),

            # Timestamp
            "timestamp":
                str(sensor_data.timestamp),
        }

        # ----------------------------------------------------
        # 6. LOG AI RESULT
        # ----------------------------------------------------

        logger.info(
            f"AI result generated | "
            f"Room={sensor_data.room_id} | "
            f"Occupancy={occupancy} | "
            f"ML={ai_result.get('ml_prediction')} | "
            f"Status={ai_result.get('status')} | "
            f"Risk={ai_result.get('risk_score')}"
        )

        # ----------------------------------------------------
        # 7. BROADCAST TO DASHBOARD
        # ----------------------------------------------------

        await manager.broadcast(
            websocket_message
        )

        logger.info(
            "WebSocket AI update broadcasted"
        )

        logger.info(
            "================================================"
        )

        # ----------------------------------------------------
        # 8. RETURN API RESPONSE
        # ----------------------------------------------------

        return SuccessResponse(
            success=True,
            message=(
                "Sensor data stored and "
                "AI analysis completed."
            ),
            data=sensor_data,
        )

    except Exception as exc:

        logger.error(
            f"Error creating sensor data: {exc}",
            exc_info=True,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to process sensor data.",
        )


# ============================================================
# LATEST SENSOR DATA
# ============================================================

@router.get(
    "/latest",
    response_model=SuccessResponse[
        SensorDataResponse
    ],
)
async def get_latest_sensor_data():

    try:

        data = (
            await sensor_service
            .get_latest_sensor_data()
        )

        if data is None:

            raise HTTPException(
                status_code=404,
                detail="No sensor data available.",
            )

        return SuccessResponse(
            success=True,
            message="Latest sensor data retrieved.",
            data=data,
        )

    except HTTPException:
        raise

    except Exception as exc:

        logger.error(
            f"Error retrieving latest sensor data: {exc}",
            exc_info=True,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve sensor data.",
        )


# ============================================================
# SENSOR HISTORY
# ============================================================

@router.get(
    "/history",
    response_model=SuccessResponse[
        List[SensorDataResponse]
    ],
)
async def get_sensor_history(
    limit: int = 100,
):

    try:

        if limit < 1:
            limit = 1

        if limit > 1000:
            limit = 1000

        data = (
            await sensor_service
            .get_sensor_history(limit)
        )

        return SuccessResponse(
            success=True,
            message="Sensor history retrieved.",
            data=data,
        )

    except Exception as exc:

        logger.error(
            f"Error retrieving sensor history: {exc}",
            exc_info=True,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve sensor history.",
        )


# ============================================================
# SENSOR DATA BY ROOM
# ============================================================

@router.get(
    "/{room_id}",
    response_model=SuccessResponse[
        List[SensorDataResponse]
    ],
)
async def get_sensor_data_by_room(
    room_id: str,
):

    try:

        data = (
            await sensor_service
            .get_sensor_data_by_room(room_id)
        )

        return SuccessResponse(
            success=True,
            message=(
                f"Sensor data retrieved "
                f"for {room_id}."
            ),
            data=data,
        )

    except Exception as exc:

        logger.error(
            f"Error retrieving sensor data "
            f"for room {room_id}: {exc}",
            exc_info=True,
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve room sensor data.",
        )
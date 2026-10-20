# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from app.models.sensor import SensorDataCreate
from app.services.sensor_service import SensorService
from app.utils.logger import logger
from app.websocket.manager import manager


router = APIRouter(
    prefix="/gas",
    tags=["Gas Sensor"],
)

sensor_service = SensorService()


class GasSensorInput(BaseModel):
    room_id: str = Field(..., min_length=1)
    gas_level: float = Field(..., ge=0)


def analyze_gas_level(gas_level: float) -> dict:
    if gas_level >= 600:
        return {
            "status": "Critical",
            "risk_score": 50,
            "reasons": ["Dangerous gas level"],
        }

    if gas_level >= 350:
        return {
            "status": "Warning",
            "risk_score": 25,
            "reasons": ["Elevated gas level"],
        }

    return {
        "status": "Normal",
        "risk_score": 0,
        "reasons": [],
    }


@router.post("/simulate")
async def simulate_gas_sensor(data: GasSensorInput):
    """
    Simulate a gas sensor reading, save it to MongoDB,
    and broadcast the update to connected frontend clients.
    """

    try:
        gas_analysis = analyze_gas_level(data.gas_level)

        # Retrieve the latest sensor reading for this room
        room_history = await sensor_service.get_sensor_data_by_room(
            data.room_id
        )

        if room_history:
            latest_sensor = room_history[0]

            # Reuse the latest values for fields not changed
            sensor_data = SensorDataCreate(
                room_id=data.room_id,
                temperature=latest_sensor.temperature,
                humidity=latest_sensor.humidity,
                gas_level=data.gas_level,
                motion_detected=latest_sensor.motion_detected,
                timestamp=datetime.utcnow(),
            )
        else:
            # Default values if the room has no previous sensor reading
            sensor_data = SensorDataCreate(
                room_id=data.room_id,
                temperature=25.0,
                humidity=50.0,
                gas_level=data.gas_level,
                motion_detected=False,
                timestamp=datetime.utcnow(),
            )

        # Save the simulated reading
        saved_sensor = await sensor_service.create_sensor_data(sensor_data)

        # Broadcast the new reading to the frontend
        await manager.broadcast(
            {
                "type": "sensor_update",
                "room_id": saved_sensor.room_id,
                "temperature": saved_sensor.temperature,
                "humidity": saved_sensor.humidity,
                "gas_level": saved_sensor.gas_level,
                "motion_detected": saved_sensor.motion_detected,
                "timestamp": str(saved_sensor.timestamp),
            }
        )

        logger.info(
            f"Simulated gas reading saved for {data.room_id}: "
            f"{data.gas_level}"
        )

        return {
            "success": True,
            "message": "Simulated gas reading saved successfully.",
            "data": {
                "room_id": data.room_id,
                "gas_level": data.gas_level,
                "status": gas_analysis["status"],
                "risk_score": gas_analysis["risk_score"],
                "reasons": gas_analysis["reasons"],
                "sensor_source": "Simulated",
                "saved_to_database": True,
            },
        }

    except Exception as e:
        logger.error(f"Error processing simulated gas reading: {e}")

        raise HTTPException(
            status_code=500,
            detail=f"Unable to process gas reading: {str(e)}",
        )
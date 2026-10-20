# pyrefly: ignore [missing-import]
from fastapi import APIRouter

from app.database.mongodb import get_database
from app.models.sensor import SensorDataResponse
from app.services.prediction_service import PredictionService
from app.ai.anomaly_detection import RuleBasedAnomalyDetector


router = APIRouter()

prediction_service = PredictionService()


@router.get("/dashboard")
async def room_dashboard():

    db = get_database()

    rooms = []

    async for room in db.rooms.find():

        sensor = await db.sensor_data.find_one(
            {
                "room_id": room["room_id"]
            },
            sort=[
                ("timestamp", -1)
            ]
        )

        # Default values when sensor data is unavailable
        temperature = sensor["temperature"] if sensor else 0
        humidity = sensor["humidity"] if sensor else 0
        gas_level = sensor["gas_level"] if sensor else 0
        motion_detected = sensor["motion_detected"] if sensor else False

        # Default AI values
        prediction = None
        confidence = None
        ai_status = "Normal"
        risk_score = 0
        reasons = []

        # Generate AI prediction only when sensor data exists
        if sensor:

            sensor_doc = dict(sensor)

            sensor_doc["id"] = str(sensor_doc.pop("_id"))

            sensor_response = SensorDataResponse(
                **sensor_doc
            )

            # Occupancy prediction
            prediction_result = await prediction_service.predict_room_status(
                room["room_id"]
            )

            if prediction_result:

                prediction = prediction_result["prediction"]
                confidence = prediction_result["confidence"]

            # Safety anomaly detection
            anomaly_result = RuleBasedAnomalyDetector.detect(
                sensor_response
            )

            ai_status = anomaly_result["status"]
            risk_score = anomaly_result["risk_score"]
            reasons = anomaly_result["reasons"]

        rooms.append({

            "room_id": room["room_id"],
            "room_name": room["room_name"],
            "building_id": room["building_id"],

            "temperature": temperature,
            "humidity": humidity,
            "gas_level": gas_level,
            "motion_detected": motion_detected,

            # AI results
            "prediction": prediction,
            "confidence": confidence,
            "status": ai_status,
            "risk_score": risk_score,
            "reasons": reasons

        })

    return {
        "success": True,
        "data": rooms
    }
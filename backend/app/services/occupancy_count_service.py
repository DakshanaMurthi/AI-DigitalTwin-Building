import os

# pyrefly: ignore [missing-import]
import joblib

from app.database.mongodb import get_database


BASE_DIR = os.path.dirname(os.path.dirname(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "ml_models",
    "room_occupancy_model.pkl",
)

model = joblib.load(MODEL_PATH)


class OccupancyCountService:
    """
    Predict number of occupants using trained ML model.
    """

    async def predict(self, room_id: str):

        db = get_database()

        sensor = await db["sensor_data"].find_one(
            {"room_id": room_id},
            sort=[("timestamp", -1)],
        )

        if sensor is None:
            return None

        temperature = sensor.get("temperature", 25.0)

        co2 = sensor.get("co2", 500.0)

        pir = 1 if sensor.get("motion_detected", False) else 0

        features = [[
            temperature,
            temperature,
            temperature,
            temperature,
            co2,
            pir,
            pir,
        ]]

        prediction = model.predict(features)[0]

        probabilities = model.predict_proba(features)[0]

        confidence = round(
            max(probabilities) * 100,
            2,
        )

        return {
            "room_id": room_id,
            "occupancy_count": int(prediction),
            "confidence": confidence,
            "temperature": temperature,
            "co2": co2,
            "pir": bool(pir),
        }
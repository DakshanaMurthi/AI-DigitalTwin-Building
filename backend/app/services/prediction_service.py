from pathlib import Path

# pyrefly: ignore [missing-import]
import joblib
# pyrefly: ignore [missing-import]
import pandas as pd

from app.ai.anomaly_detection import RuleBasedAnomalyDetector
from app.database.mongodb import get_database
from app.models.sensor import SensorDataResponse


# ============================================================
# MODEL PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    BASE_DIR
    / "app"
    / "ml_models"
    / "occupancy_model.pkl"
)


# ============================================================
# LOAD OCCUPANCY MODEL
# ============================================================

try:
    model_package = joblib.load(MODEL_PATH)

    if isinstance(model_package, dict):

        model = model_package["model"]

        model_features = model_package.get(
            "features",
            ["Temperature", "PIR"],
        )

        model_name = model_package.get(
            "model_name",
            type(model).__name__,
        )

    else:

        model = model_package

        model_features = [
            "Temperature",
            "PIR",
        ]

        model_name = type(model).__name__

    print(
        f"[PredictionService] Model loaded successfully: "
        f"{model_name}"
    )

    print(
        f"[PredictionService] Model features: "
        f"{model_features}"
    )

except Exception as e:

    print(
        f"[PredictionService] Failed to load model: {e}"
    )

    model = None

    model_features = [
        "Temperature",
        "PIR",
    ]

    model_name = "Unavailable"


# ============================================================
# PREDICTION SERVICE
# ============================================================

class PredictionService:

    async def predict_room_status(
        self,
        room_id: str,
    ):

        print(
            f"[PredictionService] Predicting room: "
            f"{room_id}"
        )

        # ----------------------------------------------------
        # DATABASE
        # ----------------------------------------------------

        db = get_database()

        sensor_doc = await db["sensor_data"].find_one(
            {
                "room_id": room_id
            },
            sort=[
                (
                    "timestamp",
                    -1
                )
            ],
        )

        if sensor_doc is None:

            print(
                f"[PredictionService] No sensor data found "
                f"for room: {room_id}"
            )

            return None

        # ----------------------------------------------------
        # CONVERT MONGODB DOCUMENT
        # ----------------------------------------------------

        sensor_doc["id"] = str(
            sensor_doc.pop("_id")
        )

        sensor = SensorDataResponse(
            **sensor_doc
        )

        # ----------------------------------------------------
        # SENSOR VALUES
        # ----------------------------------------------------

        temperature = sensor.temperature
        humidity = sensor.humidity
        gas = sensor.gas_level
        motion = sensor.motion_detected

        # ----------------------------------------------------
        # DEFAULT ML VALUES
        # ----------------------------------------------------

        ml_occupancy = None
        ml_confidence = None

        # ----------------------------------------------------
        # MACHINE LEARNING PREDICTION
        # ----------------------------------------------------

        if model is not None:

            try:

                features = pd.DataFrame(
                    [[
                        temperature,
                        int(motion),
                    ]],
                    columns=model_features,
                )

                ml_prediction = model.predict(
                    features
                )[0]

                ml_occupancy = (
                    "Occupied"
                    if ml_prediction == 1
                    else "Vacant"
                )

                # --------------------------------------------
                # CONFIDENCE
                # --------------------------------------------

                if hasattr(
                    model,
                    "predict_proba"
                ):

                    probabilities = model.predict_proba(
                        features
                    )[0]

                    ml_confidence = (
                        float(probabilities.max() * 100)
                    )

                    ml_confidence = round(
                        ml_confidence,
                        2
                    )

                print(
                    f"[PredictionService] ML prediction | "
                    f"Room={room_id} | "
                    f"Prediction={ml_occupancy} | "
                    f"Confidence={ml_confidence}"
                )

            except Exception as e:

                print(
                    f"[PredictionService] ML prediction "
                    f"failed for {room_id}: {e}"
                )

        # ----------------------------------------------------
        # OPERATIONAL OCCUPANCY
        # ----------------------------------------------------
        #
        # PIR is the actual hardware occupancy source.
        #
        # HIGH -> Occupied
        # LOW  -> Vacant
        #
        # ML remains available as supporting information.
        # ----------------------------------------------------

        if motion:

            occupancy_prediction = "Occupied"

        else:

            occupancy_prediction = "Vacant"

        occupancy_source = "PIR sensor"

        # ----------------------------------------------------
        # ANOMALY DETECTION
        # ----------------------------------------------------

        anomaly = RuleBasedAnomalyDetector.detect(
            sensor
        )

        status = anomaly.get(
            "status",
            "Normal"
        )

        risk_score = anomaly.get(
            "risk_score",
            0
        )

        reasons = anomaly.get(
            "reasons",
            []
        )

        normalized_features = anomaly.get(
            "normalized_features",
            {}
        )

        # ----------------------------------------------------
        # SUGGESTED ACTION
        # ----------------------------------------------------

        if status == "Critical":

            suggested_action = (
                "Evacuate the room immediately "
                "and inspect the source of the hazard."
            )

        elif status == "Warning":

            suggested_action = (
                "Check the room conditions and "
                "take corrective action."
            )

        else:

            suggested_action = (
                "Room conditions are normal. "
                "Continue monitoring."
            )

        # ----------------------------------------------------
        # FINAL RESULT
        # ----------------------------------------------------

        result = {

            "room_id": room_id,

            # Operational occupancy
            "prediction": occupancy_prediction,

            "occupancy_source": occupancy_source,

            "motion_detected": motion,

            # Machine learning information
            "ml_prediction": ml_occupancy,

            "ml_confidence": ml_confidence,

            "ml_model": model_name,

            # Backward compatibility
            #
            # Older PredictionResponse models may expect
            # "confidence".
            #
            "confidence": ml_confidence,

            # Sensor values
            "temperature": temperature,

            "humidity": humidity,

            "gas_level": gas,

            # AI/anomaly information
            "status": status,

            "risk_score": risk_score,

            "reasons": reasons,

            "normalized_features": normalized_features,

            "suggested_action": suggested_action,
        }

        print(
            f"[PredictionService] Final result | "
            f"Room={room_id} | "
            f"Occupancy={occupancy_prediction} | "
            f"ML={ml_occupancy} | "
            f"Status={status} | "
            f"Risk={risk_score}"
        )

        return result
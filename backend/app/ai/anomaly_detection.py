
from typing import Dict

from app.models.sensor import SensorDataResponse
from app.ai.preprocessing import DataPreprocessor


class RuleBasedAnomalyDetector:
    """
    Rule-based environmental anomaly detection.

    MQ-2 readings are raw ADC values, not calibrated ppm.
    """

    GAS_WARNING_THRESHOLD = 1500
    GAS_CRITICAL_THRESHOLD = 2000

    TEMPERATURE_WARNING_THRESHOLD = 35
    TEMPERATURE_CRITICAL_THRESHOLD = 40

    HUMIDITY_WARNING_THRESHOLD = 90

    @staticmethod
    def detect(sensor: SensorDataResponse) -> Dict:
        processed = DataPreprocessor.preprocess(sensor)

        temperature = sensor.temperature
        humidity = sensor.humidity
        gas = sensor.gas_level
        motion = sensor.motion_detected

        status = "Normal"
        reasons = []
        risk_score = 0

        # Temperature
        if temperature >= RuleBasedAnomalyDetector.TEMPERATURE_CRITICAL_THRESHOLD:
            status = "Critical"
            reasons.append("Very high temperature")
            risk_score += 40

        elif temperature >= RuleBasedAnomalyDetector.TEMPERATURE_WARNING_THRESHOLD:
            status = "Warning"
            reasons.append("High temperature")
            risk_score += 20

        # Humidity
        if humidity >= RuleBasedAnomalyDetector.HUMIDITY_WARNING_THRESHOLD:
            if status != "Critical":
                status = "Warning"

            reasons.append("Very high humidity")
            risk_score += 15

        # Gas sensor
        if gas >= RuleBasedAnomalyDetector.GAS_CRITICAL_THRESHOLD:
            status = "Critical"
            reasons.append("High gas sensor reading")
            risk_score += 50

        elif gas >= RuleBasedAnomalyDetector.GAS_WARNING_THRESHOLD:
            if status != "Critical":
                status = "Warning"

            reasons.append("Elevated gas sensor reading")
            risk_score += 25

        # Motion
        if motion:
            risk_score += 5

        risk_score = min(risk_score, 100)

        return {
            "room_id": sensor.room_id,
            "status": status,
            "risk_score": risk_score,
            "reasons": reasons,
            "normalized_features": processed["normalized_features"],
        }

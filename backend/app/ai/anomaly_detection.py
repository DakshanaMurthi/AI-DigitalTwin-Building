from typing import Dict

from app.models.sensor import SensorDataResponse
from app.ai.preprocessing import DataPreprocessor


class RuleBasedAnomalyDetector:
    """
    Rule-based anomaly detection for building sensor data.

    Status Levels
    -------------
    Normal
    Warning
    Critical

    Note
    ----
    The MQ-2 sensor currently provides a raw ADC value,
    not calibrated gas concentration in ppm.
    """

    # MQ-2 raw ADC thresholds
    GAS_WARNING_THRESHOLD = 1500
    GAS_CRITICAL_THRESHOLD = 2000

    @staticmethod
    def detect(sensor: SensorDataResponse) -> Dict:
        """
        Analyze one sensor reading and classify its status.
        """

        processed = DataPreprocessor.preprocess(sensor)

        temperature = sensor.temperature
        humidity = sensor.humidity
        gas = sensor.gas_level
        motion = sensor.motion_detected

        status = "Normal"

        reasons = []

        risk_score = 0

        # ===========================
        # Temperature
        # ===========================

        if temperature >= 40:
            status = "Critical"
            reasons.append("Very high temperature")
            risk_score += 40

        elif temperature >= 35:
            if status != "Critical":
                status = "Warning"

            reasons.append("High temperature")
            risk_score += 20

        # ===========================
        # Humidity
        # ===========================

        if humidity >= 80:
            if status != "Critical":
                status = "Warning"

            reasons.append("High humidity")
            risk_score += 15

        # ===========================
        # Gas
        # ===========================

        # MQ-2 currently provides a raw ADC value.
        #
        # 0 - 1499    : Normal
        # 1500 - 1999 : Warning
        # 2000+       : Critical

        if gas >= RuleBasedAnomalyDetector.GAS_CRITICAL_THRESHOLD:

            status = "Critical"

            reasons.append("High gas sensor reading")

            risk_score += 50

        elif gas >= RuleBasedAnomalyDetector.GAS_WARNING_THRESHOLD:

            if status != "Critical":
                status = "Warning"

            reasons.append("Elevated gas sensor reading")

            risk_score += 25

        # ===========================
        # Motion
        # ===========================

        if motion:
            risk_score += 5

        # ===========================
        # Maximum Risk Score
        # ===========================

        risk_score = min(risk_score, 100)

        return {
            "room_id": sensor.room_id,
            "status": status,
            "risk_score": risk_score,
            "reasons": reasons,
            "normalized_features": processed["normalized_features"],
        }
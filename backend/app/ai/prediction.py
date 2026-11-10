from app.ai.anomaly_detection import RuleBasedAnomalyDetector
from app.ai.preprocessing import DataPreprocessor


class PredictionEngine:
    """
    AI Prediction Engine
    """

    @staticmethod
    def predict(sensor_data: dict) -> dict:
        """
        Generate AI prediction.
        """

        normalized = DataPreprocessor.normalize(sensor_data)

        result = RuleBasedAnomalyDetector.detect(sensor_data)

        return {
            "room_id": sensor_data["room_id"],
            "status": result["status"],
            "risk_score": result["risk_score"],
            "reasons": result["reasons"],
            "normalized_features": normalized,
        }
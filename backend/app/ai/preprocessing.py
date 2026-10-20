from typing import Dict, List

from app.models.sensor import SensorDataResponse


class DataPreprocessor:
    """
    Preprocess sensor data before passing it
    to AI prediction models.
    """

    @staticmethod
    def extract_features(sensor: SensorDataResponse) -> List[float]:
        """
        Convert a sensor object into a numerical feature vector.
        """

        return [
            float(sensor.temperature),
            float(sensor.humidity),
            float(sensor.gas_level),
            1.0 if sensor.motion_detected else 0.0,
        ]

    @staticmethod
    def normalize_features(features: List[float]) -> List[float]:
        """
        Normalize sensor values to approximately 0–1 ranges.
        """

        temperature = features[0] / 50.0
        humidity = features[1] / 100.0
        gas = features[2] / 1000.0
        motion = features[3]

        return [
            round(temperature, 4),
            round(humidity, 4),
            round(gas, 4),
            motion,
        ]

    @staticmethod
    def preprocess(sensor: SensorDataResponse) -> Dict:
        """
        Complete preprocessing pipeline.
        """

        raw_features = DataPreprocessor.extract_features(sensor)

        normalized_features = DataPreprocessor.normalize_features(
            raw_features
        )

        return {
            "room_id": sensor.room_id,
            "raw_features": raw_features,
            "normalized_features": normalized_features,
        }
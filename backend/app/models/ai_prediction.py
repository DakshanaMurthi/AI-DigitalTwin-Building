from typing import List, Optional

# pyrefly: ignore [missing-import]
from pydantic import BaseModel


class PredictionResponse(BaseModel):
    """
    AI prediction and room risk response.
    """

    room_id: str

    # Final occupancy prediction
    # Determined from the PIR sensor.
    prediction: str

    # Source of the final occupancy decision.
    occupancy_source: Optional[str] = None

    # PIR sensor state.
    motion_detected: bool

    # ML occupancy prediction.
    ml_prediction: Optional[str] = None
    ml_confidence: Optional[float] = None
    ml_model: Optional[str] = None

    # Latest sensor values.
    temperature: float
    humidity: float
    gas_level: float

    # Rule-based safety assessment.
    status: str
    risk_score: int
    reasons: List[str]

    # Normalized sensor features.
    normalized_features: List[float]

    # Recommended action.
    suggested_action: Optional[str] = None
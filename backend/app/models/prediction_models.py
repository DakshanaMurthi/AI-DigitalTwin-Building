from typing import List

from pydantic import BaseModel


class PredictionResponse(BaseModel):
    """
    Prediction Response Model
    """

    room_id: str
    status: str
    risk_score: int
    reasons: List[str]
    normalized_features: List[float]
from pydantic import BaseModel


class OccupancyCountResponse(BaseModel):
    """
    Room Occupancy Count Prediction Response
    """

    room_id: str

    occupancy_count: int

    confidence: float

    temperature: float

    co2: float

    pir: bool
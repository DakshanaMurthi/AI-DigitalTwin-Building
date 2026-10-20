from datetime import datetime
from typing import Optional

# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field, ConfigDict


class SensorDataBase(BaseModel):
    """
    Base model for sensor telemetry received from ESP32.
    """

    room_id: str = Field(
        ...,
        description=(
            "Unique identifier of the room where "
            "the sensor is located."
        ),
        examples=["WORKSPACE"]
    )

    temperature: float = Field(
        ...,
        ge=-20.0,
        le=100.0,
        description="Temperature reading in Celsius (°C).",
        examples=[30.8]
    )

    humidity: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Relative humidity reading in percentage (%).",
        examples=[75.2]
    )

    gas_level: float = Field(
        ...,
        ge=0.0,
        description="Raw MQ-2 gas sensor ADC reading.",
        examples=[1200.0]
    )

    motion_detected: bool = Field(
        ...,
        description=(
            "Indicates whether motion was detected "
            "by the PIR sensor."
        ),
        examples=[False]
    )

    timestamp: datetime = Field(
        ...,
        description=(
            "Timestamp of when the sensor reading "
            "was recorded."
        ),
        examples=["2026-09-24T12:30:00+05:30"]
    )


class SensorDataCreate(SensorDataBase):
    """
    Model used for receiving new sensor readings
    from ESP32.
    """

    pass


class SensorDataResponse(SensorDataBase):
    """
    Model used for returning sensor data.
    """

    id: Optional[str] = Field(
        default=None,
        description="Unique database identifier.",
        examples=["64bc8a7e3d2a9f1b2c4e5d6f"]
    )

    model_config = ConfigDict(
        from_attributes=True
    )
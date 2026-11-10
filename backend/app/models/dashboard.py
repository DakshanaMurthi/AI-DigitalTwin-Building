# pyrefly: ignore [missing-import]
from pydantic import BaseModel


class BuildingSummary(BaseModel):
    building_id: str
    building_name: str
    total_floors: int


class StatisticsSummary(BaseModel):
    total_rooms: int
    active_rooms: int
    warning_rooms: int
    critical_rooms: int

    # Occupancy statistics
    occupied_rooms: int = 0
    vacant_rooms: int = 0


class EnvironmentSummary(BaseModel):
    average_temperature: float
    average_humidity: float
    average_gas_level: float


class AlertSummary(BaseModel):
    motion_detected: int
    gas_alerts: int


class DashboardOverview(BaseModel):
    building: BuildingSummary
    statistics: StatisticsSummary
    environment: EnvironmentSummary
    alerts: AlertSummary
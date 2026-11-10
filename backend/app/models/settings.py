from pydantic import BaseModel, Field


class BuildingSettings(BaseModel):
    building_name: str = Field(default="AI Digital Twin Building")
    location: str = Field(default="Chennai, India")
    total_floors: int = Field(default=3, ge=1)
    description: str = Field(default="Main Office Building")


class SensorThresholds(BaseModel):
    temperature_warning: float = Field(default=35, ge=0)
    gas_warning: float = Field(default=350, ge=0)
    gas_critical: float = Field(default=600, ge=0)
    humidity_warning: float = Field(default=70, ge=0, le=100)


class AlertSettings(BaseModel):
    gas_alerts: bool = True
    temperature_alerts: bool = True
    motion_alerts: bool = True
    browser_notifications: bool = False


class DashboardPreferences(BaseModel):
    automatic_refresh: bool = True
    live_websocket_updates: bool = True
    refresh_interval: int = Field(default=10, ge=2, le=300)


class SettingsResponse(BaseModel):
    building: BuildingSettings
    thresholds: SensorThresholds
    alerts: AlertSettings
    dashboard: DashboardPreferences


class SettingsUpdate(BaseModel):
    building: BuildingSettings
    thresholds: SensorThresholds
    alerts: AlertSettings
    dashboard: DashboardPreferences
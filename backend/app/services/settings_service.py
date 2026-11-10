from datetime import datetime, timezone

from app.database.mongodb import get_database
from app.models.settings import (
    SettingsResponse,
    SettingsUpdate,
)


class SettingsService:

    COLLECTION_NAME = "settings"

    DEFAULT_SETTINGS = {
        "building": {
            "building_name": "AI Digital Twin Building",
            "location": "Chennai, India",
            "total_floors": 3,
            "description": "Main Office Building",
        },
        "thresholds": {
            "temperature_warning": 35,
            "gas_warning": 350,
            "gas_critical": 600,
            "humidity_warning": 70,
        },
        "alerts": {
            "gas_alerts": True,
            "temperature_alerts": True,
            "motion_alerts": True,
            "browser_notifications": False,
        },
        "dashboard": {
            "automatic_refresh": True,
            "live_websocket_updates": True,
            "refresh_interval": 10,
        },
    }

    async def get_settings(self) -> SettingsResponse:
        db = get_database()

        document = await db[self.COLLECTION_NAME].find_one(
            {"config_id": "default"}
        )

        if document is None:
            now = datetime.now(timezone.utc)

            document = {
                "config_id": "default",
                **self.DEFAULT_SETTINGS,
                "created_at": now,
                "updated_at": now,
            }

            await db[self.COLLECTION_NAME].insert_one(document)

        return SettingsResponse(
            building=document["building"],
            thresholds=document["thresholds"],
            alerts=document["alerts"],
            dashboard=document["dashboard"],
        )

    async def update_settings(
        self,
        settings: SettingsUpdate,
    ) -> SettingsResponse:

        db = get_database()

        now = datetime.now(timezone.utc)

        document = {
            "config_id": "default",
            "building": settings.building.model_dump(),
            "thresholds": settings.thresholds.model_dump(),
            "alerts": settings.alerts.model_dump(),
            "dashboard": settings.dashboard.model_dump(),
            "updated_at": now,
        }

        await db[self.COLLECTION_NAME].update_one(
            {"config_id": "default"},
            {
                "$set": document,
                "$setOnInsert": {
                    "created_at": now,
                },
            },
            upsert=True,
        )

        return SettingsResponse(
            building=settings.building,
            thresholds=settings.thresholds,
            alerts=settings.alerts,
            dashboard=settings.dashboard,
        )


settings_service = SettingsService()
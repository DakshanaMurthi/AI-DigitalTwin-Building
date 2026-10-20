from app.database.mongodb import get_database
from app.models.dashboard import (
    BuildingSummary,
    StatisticsSummary,
    EnvironmentSummary,
    AlertSummary,
    DashboardOverview,
)
from app.services.prediction_service import PredictionService


class DashboardService:
    """
    Dashboard Service

    Provides building-level statistics using:
    - Latest sensor data
    - AI occupancy predictions
    - AI anomaly status
    """

    def __init__(self):
        self.prediction_service = PredictionService()

    async def get_dashboard_overview(self) -> DashboardOverview:

        db = get_database()

        buildings = db["buildings"]
        rooms = db["rooms"]
        sensors = db["sensor_data"]

        # =====================
        # Building Summary
        # =====================

        building_doc = await buildings.find_one()

        if building_doc:
            building = BuildingSummary(
                building_id=building_doc["building_id"],
                building_name=building_doc["building_name"],
                total_floors=building_doc["total_floors"],
            )
        else:
            building = BuildingSummary(
                building_id="N/A",
                building_name="No Building",
                total_floors=0,
            )

        # =====================
        # Dashboard Statistics
        # =====================

        total_rooms = 0

        # Normal / Warning / Critical
        active_rooms = 0
        warning_rooms = 0
        critical_rooms = 0

        # Occupancy
        occupied_rooms = 0
        vacant_rooms = 0

        # Environment
        temperatures = []
        humidities = []
        gas_levels = []

        # Alerts
        motion_detected = 0
        gas_alerts = 0

        # =====================
        # Process Each Room
        # =====================

        async for room in rooms.find().sort("floor_number", 1):

            total_rooms += 1

            room_id = room["room_id"]

            # Get latest sensor record for this room
            latest_sensor = await sensors.find_one(
                {"room_id": room_id},
                sort=[("timestamp", -1)]
            )

            # If no sensor data exists, continue
            if not latest_sensor:
                continue

            # =====================
            # Latest Environment Data
            # =====================

            temperature = latest_sensor.get("temperature", 0)
            humidity = latest_sensor.get("humidity", 0)
            gas_level = latest_sensor.get("gas_level", 0)
            motion = latest_sensor.get("motion_detected", False)

            temperatures.append(temperature)
            humidities.append(humidity)
            gas_levels.append(gas_level)

            # Motion alert
            if motion:
                motion_detected += 1

            # Gas alert
            if gas_level >= 600:
                gas_alerts += 1

            # =====================
            # AI Prediction
            # =====================

            ai_result = await self.prediction_service.predict_room_status(
                room_id
            )

            if not ai_result:
                continue

            prediction = ai_result.get("prediction")
            status = ai_result.get("status", "Normal")

            # =====================
            # Occupancy Statistics
            # =====================

            if prediction == "Occupied":
                occupied_rooms += 1

            elif prediction == "Vacant":
                vacant_rooms += 1

            # =====================
            # AI Risk Statistics
            # =====================

            if status == "Critical":
                critical_rooms += 1

            elif status == "Warning":
                warning_rooms += 1

            else:
                active_rooms += 1

        # =====================
        # Environment Summary
        # =====================

        average_temperature = (
            round(sum(temperatures) / len(temperatures), 2)
            if temperatures
            else 0
        )

        average_humidity = (
            round(sum(humidities) / len(humidities), 2)
            if humidities
            else 0
        )

        average_gas_level = (
            round(sum(gas_levels) / len(gas_levels), 2)
            if gas_levels
            else 0
        )

        environment = EnvironmentSummary(
            average_temperature=average_temperature,
            average_humidity=average_humidity,
            average_gas_level=average_gas_level,
        )

        # =====================
        # Statistics Summary
        # =====================

        statistics = StatisticsSummary(
            total_rooms=total_rooms,
            active_rooms=active_rooms,
            warning_rooms=warning_rooms,
            critical_rooms=critical_rooms,
            occupied_rooms=occupied_rooms,
            vacant_rooms=vacant_rooms,
        )

        # =====================
        # Alert Summary
        # =====================

        alerts = AlertSummary(
            motion_detected=motion_detected,
            gas_alerts=gas_alerts,
        )

        # =====================
        # Final Dashboard Response
        # =====================

        return DashboardOverview(
            building=building,
            statistics=statistics,
            environment=environment,
            alerts=alerts,
        )
from typing import List, Optional

from app.database.mongodb import get_database
from app.models.sensor import SensorDataCreate, SensorDataResponse
from app.utils.logger import logger


class SensorService:
    def __init__(self):
        self.collection_name = "sensor_data"

    @property
    def _collection(self):
        """
        Return the sensor_data collection from the currently
        configured MongoDB database.
        """
        db = get_database()
        return db[self.collection_name]

    def _map_doc_to_response(self, doc: dict) -> SensorDataResponse:
        """
        Convert MongoDB document into SensorDataResponse.
        """
        doc = dict(doc)

        if "_id" in doc:
            doc["id"] = str(doc.pop("_id"))

        return SensorDataResponse(**doc)

    async def create_sensor_data(
        self,
        sensor: SensorDataCreate
    ) -> SensorDataResponse:
        """
        Save a new ESP32 sensor reading into MongoDB.
        """
        try:
            # ---------------------------------------------------------
            # Get configured database
            # ---------------------------------------------------------
            db = get_database()
            collection = db[self.collection_name]

            # ---------------------------------------------------------
            # Convert Pydantic model to dictionary
            # ---------------------------------------------------------
            sensor_dict = sensor.model_dump()

            # ---------------------------------------------------------
            # Diagnostic logging
            # ---------------------------------------------------------
            logger.info("========== SENSOR INSERT DEBUG ==========")
            logger.info(f"MongoDB database: {db.name}")
            logger.info(f"MongoDB collection: {self.collection_name}")
            logger.info(f"Sensor data received: {sensor_dict}")

            # ---------------------------------------------------------
            # Insert document
            # ---------------------------------------------------------
            result = await collection.insert_one(sensor_dict)

            logger.info(
                f"MongoDB inserted ID: {result.inserted_id}"
            )

            # ---------------------------------------------------------
            # Verify inserted document
            # ---------------------------------------------------------
            inserted_doc = await collection.find_one(
                {"_id": result.inserted_id}
            )

            if not inserted_doc:
                raise RuntimeError(
                    "MongoDB insert succeeded, but the inserted "
                    "document could not be retrieved."
                )

            logger.info(
                f"MongoDB insert verified successfully: {inserted_doc}"
            )

            logger.info(
                "=========================================="
            )

            # ---------------------------------------------------------
            # Return response
            # ---------------------------------------------------------
            return self._map_doc_to_response(inserted_doc)

        except Exception as e:
            logger.error(
                f"Error creating sensor data: {e}",
                exc_info=True
            )
            raise

    async def get_latest_sensor_data(
        self
    ) -> Optional[SensorDataResponse]:
        """
        Retrieve the most recent sensor reading.
        """
        try:
            db = get_database()
            collection = db[self.collection_name]

            latest_doc = await collection.find_one(
                {},
                sort=[("timestamp", -1)]
            )

            if not latest_doc:
                return None

            return self._map_doc_to_response(latest_doc)

        except Exception as e:
            logger.error(
                f"Error retrieving latest sensor data: {e}",
                exc_info=True
            )
            raise

    async def get_sensor_history(
        self,
        limit: int = 100
    ) -> List[SensorDataResponse]:
        """
        Retrieve historical sensor readings.
        """
        try:
            db = get_database()
            collection = db[self.collection_name]

            cursor = (
                collection
                .find({})
                .sort("timestamp", -1)
                .limit(limit)
            )

            history = []

            async for doc in cursor:
                history.append(
                    self._map_doc_to_response(doc)
                )

            return history

        except Exception as e:
            logger.error(
                f"Error retrieving sensor history: {e}",
                exc_info=True
            )
            raise

    async def get_sensor_data_by_room(
        self,
        room_id: str
    ) -> List[SensorDataResponse]:
        """
        Retrieve all sensor readings for a specific room.
        """
        try:
            db = get_database()
            collection = db[self.collection_name]

            cursor = (
                collection
                .find({"room_id": room_id})
                .sort("timestamp", -1)
            )

            room_data = []

            async for doc in cursor:
                room_data.append(
                    self._map_doc_to_response(doc)
                )

            return room_data

        except Exception as e:
            logger.error(
                f"Error retrieving sensor data "
                f"for room {room_id}: {e}",
                exc_info=True
            )
            raise
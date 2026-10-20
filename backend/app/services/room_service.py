from datetime import datetime
from typing import List, Optional

# pyrefly: ignore [missing-import]
from pymongo import DESCENDING

from app.database.mongodb import get_database
from app.models.room import (
    RoomCreate,
    RoomUpdate,
    RoomResponse,
    DashboardRoomResponse,
)
from app.services.prediction_service import PredictionService
from app.utils.logger import logger


class RoomService:
    """
    Service class for handling Room-related database operations.
    """

    def __init__(self):
        self.collection_name = "rooms"
        self.prediction_service = PredictionService()

    # ---------------------------------------------------------
    # DATABASE COLLECTION
    # ---------------------------------------------------------

    async def _get_collection(self):
        db = get_database()
        return db[self.collection_name]

    # ---------------------------------------------------------
    # MAP DATABASE DOCUMENT TO RESPONSE
    # ---------------------------------------------------------

    def _map_doc_to_response(
        self,
        document
    ) -> RoomResponse:

        return RoomResponse(
            id=str(document["_id"]),
            building_id=document["building_id"],
            floor_number=document["floor_number"],
            room_id=document["room_id"],
            room_name=document["room_name"],
            room_type=document["room_type"],
            x_coordinate=document["x_coordinate"],
            y_coordinate=document["y_coordinate"],
            width=document["width"],
            height=document["height"],
            status=document.get("status", "Normal"),
            created_at=document["created_at"],
            updated_at=document["updated_at"],
        )

    # ---------------------------------------------------------
    # CREATE ROOM
    # ---------------------------------------------------------

    async def create_room(
        self,
        room: RoomCreate
    ) -> RoomResponse:

        collection = await self._get_collection()

        room_data = room.model_dump()

        room_data["created_at"] = datetime.utcnow()
        room_data["updated_at"] = datetime.utcnow()

        # Make sure every newly created room has a status
        if "status" not in room_data:
            room_data["status"] = "Normal"

        result = await collection.insert_one(
            room_data
        )

        document = await collection.find_one(
            {
                "_id": result.inserted_id
            }
        )

        logger.info(
            f"Room created successfully: {room.room_id}"
        )

        return self._map_doc_to_response(
            document
        )

    # ---------------------------------------------------------
    # GET ALL ROOMS
    # ---------------------------------------------------------

    async def get_all_rooms(
        self
    ) -> List[RoomResponse]:

        collection = await self._get_collection()

        cursor = collection.find().sort(
            "floor_number",
            1
        )

        rooms = []

        async for document in cursor:

            rooms.append(
                self._map_doc_to_response(
                    document
                )
            )

        return rooms

    # ---------------------------------------------------------
    # GET ROOM BY ID
    # ---------------------------------------------------------

    async def get_room_by_id(
        self,
        room_id: str,
    ) -> Optional[RoomResponse]:

        collection = await self._get_collection()

        document = await collection.find_one(
            {
                "room_id": room_id
            }
        )

        if not document:
            return None

        return self._map_doc_to_response(
            document
        )

    # ---------------------------------------------------------
    # UPDATE ROOM
    # ---------------------------------------------------------

    async def update_room(
        self,
        room_id: str,
        room_update: RoomUpdate,
    ) -> Optional[RoomResponse]:

        collection = await self._get_collection()

        update_data = room_update.model_dump(
            exclude_unset=True
        )

        if not update_data:

            return await self.get_room_by_id(
                room_id
            )

        update_data["updated_at"] = (
            datetime.utcnow()
        )

        await collection.update_one(
            {
                "room_id": room_id
            },
            {
                "$set": update_data
            },
        )

        return await self.get_room_by_id(
            room_id
        )

    # ---------------------------------------------------------
    # DELETE ROOM
    # ---------------------------------------------------------

    async def delete_room(
        self,
        room_id: str,
    ) -> bool:

        collection = await self._get_collection()

        result = await collection.delete_one(
            {
                "room_id": room_id
            }
        )

        if result.deleted_count > 0:

            logger.info(
                f"Room deleted: {room_id}"
            )

            return True

        return False

    # ---------------------------------------------------------
    # GET ROOMS BY FLOOR
    # ---------------------------------------------------------

    async def get_rooms_by_floor(
        self,
        floor_number: int,
    ) -> List[RoomResponse]:

        collection = await self._get_collection()

        cursor = collection.find(
            {
                "floor_number": floor_number
            }
        ).sort(
            "room_id",
            DESCENDING
        )

        rooms = []

        async for document in cursor:

            rooms.append(
                self._map_doc_to_response(
                    document
                )
            )

        return rooms

    # ---------------------------------------------------------
    # DASHBOARD ROOMS
    # ---------------------------------------------------------

    async def get_dashboard_rooms(
        self,
    ) -> List[DashboardRoomResponse]:
        """
        Retrieve all rooms with:

        - Latest sensor values
        - PIR-based occupancy prediction
        - AI anomaly status
        - AI risk score
        - Anomaly reasons

        Important:
        The final occupancy prediction comes from the
        physical PIR sensor.

        ML confidence is NOT used as dashboard occupancy
        confidence because it does not represent confidence
        in the PIR-based final occupancy result.
        """

        collection = await self._get_collection()

        db = get_database()

        sensor_collection = db[
            "sensor_data"
        ]

        dashboard_rooms = []

        # -----------------------------------------------------
        # GET ALL ROOMS
        # -----------------------------------------------------

        async for room in collection.find().sort(
            "floor_number",
            1
        ):

            room_id = room["room_id"]

            # -------------------------------------------------
            # GET LATEST SENSOR DATA
            # -------------------------------------------------

            latest_sensor = (
                await sensor_collection.find_one(
                    {
                        "room_id": room_id
                    },
                    sort=[
                        (
                            "timestamp",
                            -1
                        )
                    ]
                )
            )

            # -------------------------------------------------
            # DEFAULT VALUES
            # -------------------------------------------------

            prediction = None

            # IMPORTANT:
            # Do not expose ML confidence as final
            # occupancy confidence.
            confidence = None

            risk_score = 0

            reasons = []

            # FIX:
            # Safely read room status.
            # If the MongoDB room document does not contain
            # "status", use "Normal".
            room_status = room.get(
                "status",
                "Normal"
            )

            # -------------------------------------------------
            # PROCESS SENSOR DATA
            # -------------------------------------------------

            if latest_sensor:

                ai_result = (
                    await self.prediction_service
                    .predict_room_status(
                        room_id
                    )
                )

                if ai_result:

                    # -----------------------------------------
                    # FINAL OCCUPANCY
                    # -----------------------------------------
                    #
                    # This comes from PIR sensor.
                    #
                    # PIR HIGH -> Occupied
                    # PIR LOW  -> Vacant
                    #
                    # -----------------------------------------

                    prediction = (
                        ai_result.get(
                            "prediction"
                        )
                    )

                    # -----------------------------------------
                    # NO ML CONFIDENCE
                    # -----------------------------------------

                    confidence = None

                    # -----------------------------------------
                    # RISK SCORE
                    # -----------------------------------------

                    risk_score = (
                        ai_result.get(
                            "risk_score",
                            0
                        )
                    )

                    # -----------------------------------------
                    # ANOMALY REASONS
                    # -----------------------------------------

                    reasons = (
                        ai_result.get(
                            "reasons",
                            []
                        )
                    )

                    # -----------------------------------------
                    # ROOM ENVIRONMENT STATUS
                    # -----------------------------------------
                    #
                    # AI anomaly detector is the primary source
                    # for current environmental status.
                    #
                    # If AI does not provide a status, fall back
                    # to the room's stored status.
                    #
                    # -----------------------------------------

                    room_status = (
                        ai_result.get(
                            "status",
                            room.get(
                                "status",
                                "Normal"
                            )
                        )
                    )

            # -------------------------------------------------
            # BUILD DASHBOARD RESPONSE
            # -------------------------------------------------

            dashboard_rooms.append(
                DashboardRoomResponse(

                    id=str(
                        room["_id"]
                    ),

                    building_id=(
                        room["building_id"]
                    ),

                    floor_number=(
                        room["floor_number"]
                    ),

                    room_id=room_id,

                    room_name=(
                        room["room_name"]
                    ),

                    room_type=(
                        room["room_type"]
                    ),

                    x_coordinate=(
                        room["x_coordinate"]
                    ),

                    y_coordinate=(
                        room["y_coordinate"]
                    ),

                    width=(
                        room["width"]
                    ),

                    height=(
                        room["height"]
                    ),

                    status=room_status,

                    created_at=(
                        room["created_at"]
                    ),

                    updated_at=(
                        room["updated_at"]
                    ),

                    # -----------------------------------------
                    # SENSOR VALUES
                    # -----------------------------------------

                    temperature=(
                        latest_sensor[
                            "temperature"
                        ]
                        if latest_sensor
                        else None
                    ),

                    humidity=(
                        latest_sensor[
                            "humidity"
                        ]
                        if latest_sensor
                        else None
                    ),

                    gas_level=(
                        latest_sensor[
                            "gas_level"
                        ]
                        if latest_sensor
                        else None
                    ),

                    motion_detected=(
                        latest_sensor[
                            "motion_detected"
                        ]
                        if latest_sensor
                        else False
                    ),

                    # -----------------------------------------
                    # OCCUPANCY
                    # -----------------------------------------

                    prediction=prediction,

                    # -----------------------------------------
                    # IMPORTANT:
                    # No misleading ML confidence
                    # -----------------------------------------

                    confidence=None,

                    # -----------------------------------------
                    # RISK
                    # -----------------------------------------

                    risk_score=risk_score,

                    reasons=reasons,
                )
            )

        return dashboard_rooms
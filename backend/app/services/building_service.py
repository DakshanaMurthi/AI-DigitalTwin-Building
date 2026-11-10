from datetime import datetime
from typing import List, Optional

# pyrefly: ignore [missing-import]
from pymongo import ASCENDING

from app.database.mongodb import get_database
from app.models.building import (
    BuildingCreate,
    BuildingUpdate,
    BuildingResponse,
)
from app.utils.logger import logger


class BuildingService:
    """
    Service class for Building CRUD operations.
    """

    def __init__(self):
        self.collection_name = "buildings"

    async def _get_collection(self):
        db = get_database()
        return db[self.collection_name]

    def _map_doc_to_response(self, document) -> BuildingResponse:
        """
        Convert MongoDB document into BuildingResponse.
        """

        return BuildingResponse(
            id=str(document["_id"]),
            building_id=document["building_id"],
            building_name=document["building_name"],
            total_floors=document["total_floors"],
            location=document["location"],
            description=document.get("description"),
            status=document["status"],
            created_at=document["created_at"],
            updated_at=document["updated_at"],
        )

    async def create_building(
        self,
        building: BuildingCreate,
    ) -> BuildingResponse:
        """
        Create a new building.
        """

        collection = await self._get_collection()

        building_data = building.model_dump()

        building_data["created_at"] = datetime.utcnow()
        building_data["updated_at"] = datetime.utcnow()

        result = await collection.insert_one(building_data)

        document = await collection.find_one(
            {"_id": result.inserted_id}
        )

        logger.info(
            f"Building created successfully: {building.building_id}"
        )

        return self._map_doc_to_response(document)

    async def get_all_buildings(
        self,
    ) -> List[BuildingResponse]:
        """
        Get all buildings.
        """

        collection = await self._get_collection()

        cursor = collection.find().sort(
            "building_name",
            ASCENDING
        )

        buildings = []

        async for document in cursor:
            buildings.append(
                self._map_doc_to_response(document)
            )

        return buildings

    async def get_building_by_id(
        self,
        building_id: str,
    ) -> Optional[BuildingResponse]:
        """
        Get one building by building_id.
        """

        collection = await self._get_collection()

        document = await collection.find_one(
            {"building_id": building_id}
        )

        if not document:
            return None

        return self._map_doc_to_response(document)

    async def update_building(
        self,
        building_id: str,
        building_update: BuildingUpdate,
    ) -> Optional[BuildingResponse]:
        """
        Update building.
        """

        collection = await self._get_collection()

        update_data = building_update.model_dump(
            exclude_unset=True
        )

        if not update_data:
            return await self.get_building_by_id(
                building_id
            )

        update_data["updated_at"] = datetime.utcnow()

        await collection.update_one(
            {"building_id": building_id},
            {"$set": update_data},
        )

        return await self.get_building_by_id(
            building_id
        )

    async def delete_building(
        self,
        building_id: str,
    ) -> bool:
        """
        Delete building.
        """

        collection = await self._get_collection()

        result = await collection.delete_one(
            {"building_id": building_id}
        )

        if result.deleted_count > 0:
            logger.info(
                f"Building deleted: {building_id}"
            )
            return True

        return False
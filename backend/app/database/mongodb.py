# pyrefly: ignore [missing-import]
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config.config import settings
from app.utils.logger import logger

class MongoDB:
    client: AsyncIOMotorClient = None

db = MongoDB()

async def connect_to_mongo() -> None:
    """Initialize the MongoDB connection and verify it."""
    try:
        logger.info("Connecting to MongoDB...")
        db.client = AsyncIOMotorClient(settings.MONGODB_URI)
        
        # Ping the database to verify the connection
        await db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e

async def close_mongo_connection() -> None:
    """Close the MongoDB connection gracefully."""
    if db.client is not None:
        logger.info("Closing MongoDB connection...")
        db.client.close()
        logger.info("MongoDB connection closed.")

def get_database() -> AsyncIOMotorDatabase:
    """Return the selected MongoDB database instance."""
    if db.client is None:
        raise ConnectionError("MongoDB client is not initialized.")
    return db.client[settings.DATABASE_NAME]

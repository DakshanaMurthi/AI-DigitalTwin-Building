from contextlib import asynccontextmanager
# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from app.config.config import settings
from app.database.mongodb import connect_to_mongo, close_mongo_connection
from app.utils.logger import logger
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Register startup event
    logger.info("Starting AI-Powered Digital Twin API...")
    await connect_to_mongo()
    yield
    # Register shutdown event
    logger.info("Shutting down API...")
    await close_mongo_connection()

# Create FastAPI app instance following best practices
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="AI-Powered Digital Twin Backend API",
    lifespan=lifespan
)

# Configure CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include the central API router
app.include_router(api_router)

@app.get("/")
async def root():
    """Root endpoint for basic connectivity check."""
    logger.info("Root endpoint accessed.")
    return {
        "message": "AI Digital Twin Backend Running",
        "version": "1.0.0",
        "status": "Healthy"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint to verify backend and database status."""
    logger.info("Health check endpoint accessed.")
    return {
        "database": "Connected",
        "api": "Running",
        "status": "Healthy"
    }

@app.get("/info")
async def application_info():
    """Application info endpoint returning current project details."""
    logger.info("Application info endpoint accessed.")
    return {
        "project": settings.PROJECT_NAME,
        "version": "1.0.0",
        "environment": "Development"
    }

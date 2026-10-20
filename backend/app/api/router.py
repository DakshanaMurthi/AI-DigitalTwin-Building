# pyrefly: ignore [missing-import]
from fastapi import APIRouter

from app.api.routes.sensor_routes import router as sensor_router
from app.api.routes.room_routes import router as room_router
from app.api.routes.building_routes import router as building_router
from app.api.routes.dashboard_routes import router as dashboard_router
from app.api.routes.prediction_routes import router as prediction_router
from app.api.routes.websocket_routes import router as websocket_router
from app.api.routes.occupancy_count_routes import router as occupancy_router
from app.api.routes.gas_routes import router as gas_router


api_router = APIRouter()


# ==========================
# Sensor APIs
# ==========================
api_router.include_router(
    sensor_router,
    prefix="/sensor-data",
    tags=["Sensor Data"],
)


# ==========================
# Room APIs
# ==========================
api_router.include_router(
    room_router,
    prefix="/rooms",
    tags=["Rooms"],
)


# ==========================
# Building APIs
# ==========================
api_router.include_router(
    building_router,
    prefix="/buildings",
    tags=["Buildings"],
)


# ==========================
# Dashboard API
# ==========================
api_router.include_router(
    dashboard_router
)


# ==========================
# AI Prediction API
# ==========================
api_router.include_router(
    prediction_router
)


# ==========================
# Occupancy Count API
# ==========================
api_router.include_router(
    occupancy_router
)


# ==========================
# Gas Sensor API
# ==========================
api_router.include_router(
    gas_router
)


# ==========================
# WebSocket
# ==========================
api_router.include_router(
    websocket_router
)
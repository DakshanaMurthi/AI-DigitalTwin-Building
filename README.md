# AI-Powered Digital Twin for Intelligent Building Monitoring and Predictive Management

## Overview
This project is a Full Stack AI + IoT solution designed to create a scalable, production-ready Digital Twin for building monitoring and predictive management. It leverages FastAPI for the backend, React for the frontend, MongoDB for data storage, and integrates ESP32 devices for real-time IoT telemetry. The system employs Machine Learning for predictive analytics and is structured to seamlessly support a 3D Digital Twin in its next phase.

## Project Structure

```text
.
├── backend/                  # Backend Application (FastAPI)
│   ├── app/                  # Main application code
│   │   ├── ai/               # AI & ML integrations
│   │   ├── api/              # API routers and endpoints
│   │   │   └── routes/
│   │   ├── config/           # Configuration settings
│   │   ├── constants/        # Application constants
│   │   ├── core/             # Core logic (security, events)
│   │   ├── database/         # Database connection & ODM
│   │   ├── exceptions/       # Custom exception handlers
│   │   ├── logs/             # Application logs
│   │   ├── middleware/       # HTTP middleware
│   │   ├── ml_models/        # Machine Learning models (Phase 2)
│   │   ├── models/           # Data models/schemas
│   │   ├── services/         # Business logic
│   │   ├── uploads/          # Uploaded files
│   │   ├── utils/            # Utility functions
│   │   ├── validators/       # Request validation (Phase 2)
│   │   └── websocket/        # Real-time WebSocket handlers (Phase 2)
│   └── tests/                # Backend test suite
│
├── frontend/                 # Frontend Application (React)
│   ├── src/
│   │   ├── api/              # API client & hooks
│   │   ├── components/
│   │   │   ├── 2d/           # 2D visual components (Phase 2)
│   │   │   ├── 3d/           # 3D Digital Twin components (Phase 2)
│   │   │   ├── layout/       # App layout components
│   │   │   └── ui/           # Reusable UI elements
│   │   ├── config/           # Frontend config
│   │   ├── constants/        # Frontend constants
│   │   └── styles/           # Global styles and themes
│   └── tests/                # Frontend test suite
│
├── .env.example              # Environment variables template
├── requirements-dev.txt      # Development dependencies
└── README.md                 # Project documentation
```

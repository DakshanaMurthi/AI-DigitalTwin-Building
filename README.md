# 🏢 AI-Powered Digital Twin for Intelligent Building Monitoring and Predictive Management

An AI-powered Digital Twin Building Management System that integrates IoT sensors, machine learning, and a real-time web dashboard to monitor building conditions, analyze environmental data, and support intelligent building management.

---

## 📌 Project Overview

The **AI Digital Twin Building** project develops a smart building monitoring system that creates a digital representation of the physical building using real-time IoT sensor data.

ESP32-based hardware collects environmental information and sends it to the backend through Wi-Fi. The backend processes and stores the incoming data. The React dashboard displays building conditions and room-level information.

Machine learning models and collected datasets support intelligent analysis and predictive workflows.

The main goal is to improve building monitoring, identify abnormal environmental conditions, and support better decision-making.

## 🎯 Objectives

- Monitor building environmental conditions in real time.
- Collect sensor data using ESP32 hardware.
- Display room-level information through a digital dashboard.
- Analyze temperature, humidity, gas levels, and occupancy.
- Integrate machine learning models for intelligent analysis.
- Calculate and display room risk levels.
- Support early identification of abnormal conditions.
- Provide a centralized interface for building monitoring.

## ✨ Key Features

### 1. IoT-Based Monitoring
- ESP32-based sensor data collection.
- Wi-Fi communication between hardware and backend.
- Continuous sensor data transmission.
- Real-time building condition monitoring.

### 2. Digital Twin Dashboard
- Interactive building monitoring interface.
- Room-wise monitoring.
- Live sensor information.
- Room status indicators.
- Centralized building overview.

### 3. Environmental Monitoring
- Temperature monitoring.
- Humidity monitoring.
- Gas-level monitoring.
- Occupancy status monitoring.
- Room-level risk score display.

### 4. AI and Machine Learning
- Machine learning model integration.
- Dataset-based analysis.
- Predictive analytics workflows.
- Intelligent building condition assessment.

### 5. Room Monitoring
The dashboard provides individual room monitoring, including:
- Reception
- Workspace

Each room displays relevant environmental readings, occupancy information, and risk status.

---

## 🏗️ System Architecture

The system follows an IoT-to-dashboard architecture.

```text
        PHYSICAL BUILDING
               |
               v
        IoT SENSOR DEVICES
               |
               v
             ESP32
               |
          Wi-Fi Network
               |
               v
       FASTAPI BACKEND
               |
        +------+------+
        |             |
        v             v
     MongoDB       AI / ML
        |           Models
        |             |
        +------+------+
               |
               v
       REACT DASHBOARD
               |
               v
      BUILDING DIGITAL TWIN
               |
               v
      MONITORING AND ANALYSIS
```

### Data Flow

1. Sensors collect environmental readings from the building.
2. ESP32 processes the sensor readings and sends them through Wi-Fi.
3. FastAPI receives and processes the incoming data.
4. MongoDB stores application data.
5. AI/ML components support intelligent analysis.
6. The React frontend displays the building's current condition.
7. Users monitor rooms and identify abnormal conditions through the dashboard.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Frontend Build Tool | Vite |
| UI Framework | Material UI |
| Charts | Recharts |
| Backend | Python, FastAPI |
| Database | MongoDB |
| Machine Learning | Python, Scikit-learn ecosystem |
| Hardware | ESP32 |
| Sensor Communication | Wi-Fi, HTTP |
| API Communication | REST API |
| Version Control | Git and GitHub |

---

## 📂 Project Structure

```text
AI-DigitalTwin-Building/
│
├── architecture/
│   └── System architecture diagram
│
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   ├── api/
│   │   ├── config/
│   │   ├── constants/
│   │   ├── core/
│   │   ├── database/
│   │   ├── exceptions/
│   │   ├── logs/
│   │   ├── middleware/
│   │   ├── ml_models/
│   │   ├── models/
│   │   ├── services/
│   │   ├── uploads/
│   │   ├── utils/
│   │   ├── validators/
│   │   └── websocket/
│   │
│   ├── requirements.txt
│   └── README.md
│
├── conference_paper/
│   └── Research papers
│
├── datasets/
│   └── gas_sensor/
│       └── Sensor datasets
│
├── Demo_Video/
│   └── Demo video
│
├── esp32/
│   └── Hardware and sensor code
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── config/
│   │   ├── constants/
│   │   └── styles/
│   │
│   ├── package.json
│   └── vite.config.js
│
├── reports/
│   └── Project reports
│
├── screenshots/
│   └── Application screenshots
│
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

---

## ⚙️ Installation and Setup

### Prerequisites

Install the following software before running the project:

- Python 3.10 or later
- Node.js and npm
- MongoDB
- Git
- Arduino IDE (for ESP32 hardware)

### 1. Clone the Repository

```bash
git clone https://github.com/DakshanaMurthi/AI-DigitalTwin-Building.git

cd AI-DigitalTwin-Building
```

### 2. Backend Setup

Open a terminal:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

Activate the environment on Windows:

```powershell
.\venv\Scripts\Activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Configure the required environment variables using the project's `.env.example` file.

Make sure MongoDB is running and its connection settings are configured correctly.

Start the FastAPI server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend URL:

```text
http://127.0.0.1:8000
```

API Documentation:

```text
http://127.0.0.1:8000/docs
```

Health Check:

```text
http://127.0.0.1:8000/health
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal. The default Vite address is:

```text
http://localhost:5173
```

### 4. Hardware Setup

1. Open the ESP32 firmware in Arduino IDE.
2. Install the required sensor and communication libraries.
3. Configure Wi-Fi credentials locally.
4. Configure the backend server address.
5. Connect the required sensors to the ESP32.
6. Upload the firmware to the ESP32.
7. Ensure the ESP32 and backend can communicate over the same network.

**Important:** Never upload actual Wi-Fi passwords, API keys, or private credentials to GitHub.

---

## 📊 Dashboard Monitoring

The dashboard provides room-level monitoring and environmental information.

| Parameter | Description |
|---|---|
| Occupancy | Indicates whether a room is occupied or vacant |
| Temperature | Displays the room temperature in °C |
| Humidity | Displays relative humidity |
| Gas Level | Displays the detected gas sensor reading |
| Risk Score | Displays the calculated room risk level |
| Room Status | Indicates the current room condition |

The dashboard helps users monitor building conditions from a centralized interface.

---

## 📁 Dataset

The repository includes sensor datasets used for machine learning and analysis.

Dataset location:

```text
datasets/
└── gas_sensor/
```

The dataset supports sensor-data analysis and machine learning workflows.

---

## 📸 Application Screenshots

Application screenshots are available in the following directory:

```text
screenshots/
```

These screenshots demonstrate the project's dashboard and application interface.

---

## 🎥 Project Demonstration

The project demonstration video is available here:

[View Project Demo Video](Demo_Video/Demo%20video.mp4)

---

## 📄 Project Documentation

The repository contains project documentation and research materials.

- **Architecture:** System architecture diagram.
- **Conference Paper:** Research paper materials.
- **Reports:** Project documentation and final report.
- **Datasets:** Sensor data used in the project.
- **Screenshots:** Application interface screenshots.
- **Demo Video:** Project demonstration.

---

## 🚀 Future Enhancements

- Interactive 3D building visualization.
- Advanced predictive maintenance.
- Energy consumption forecasting.
- Occupancy forecasting.
- Advanced anomaly detection.
- Intelligent building optimization.
- Mobile-based monitoring.
- Cloud deployment and remote access.

---

## 🔒 Security Notes

- Keep `.env` files out of version control.
- Do not commit Wi-Fi passwords or API keys.
- Use environment variables for sensitive configuration.
- Restrict database access using appropriate credentials.
- Avoid exposing private network configuration in public deployments.

---

## 👥 Project Team

**Project:** AI-Powered Digital Twin Building Management System

**Repository:** [AI-DigitalTwin-Building](https://github.com/DakshanaMurthi/AI-DigitalTwin-Building)

---

## 📜 License

This project is developed for academic and educational purposes.

---

## 💡 Conclusion

The AI-Powered Digital Twin Building project combines IoT hardware, backend services, machine learning, and a web-based dashboard to create an intelligent building monitoring solution.

By connecting physical sensor data with a digital monitoring platform, the system supports real-time environmental monitoring, room-level analysis, and smarter building management.

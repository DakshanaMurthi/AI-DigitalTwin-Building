#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "time.h"

// ============================================================
//                    WIFI CONFIGURATION
// ============================================================

const char* WIFI_SSID = "realme 9i";
const char* WIFI_PASSWORD = "dakshana1865";

// ============================================================
//                    SERVER CONFIGURATION
// ============================================================

const char* SERVER_URL = "http://10.94.26.144:8000";
const char* SENSOR_ENDPOINT = "/sensor-data/";

// ============================================================
//                    TIME CONFIGURATION
// ============================================================

const long GMT_OFFSET_SEC = 19800;   // UTC +5:30
const int DAYLIGHT_OFFSET_SEC = 0;

// ============================================================
//                    DHT CONFIGURATION
// ============================================================

#define DHT_TYPE DHT11

#define DHT_RECEPTION 4
#define DHT_WORKSPACE 5
#define DHT_MANAGER   18

DHT dhtReception(DHT_RECEPTION, DHT_TYPE);
DHT dhtWorkspace(DHT_WORKSPACE, DHT_TYPE);
DHT dhtManager(DHT_MANAGER, DHT_TYPE);

// ============================================================
//                    PIR CONFIGURATION
// ============================================================

#define PIR_RECEPTION 19
#define PIR_WORKSPACE 21
#define PIR_MANAGER   22

// ============================================================
//                    MQ-2 CONFIGURATION
// ============================================================

#define MQ2_PIN 34

// Raw ADC thresholds
#define GAS_WARNING_THRESHOLD 1500
#define GAS_CRITICAL_THRESHOLD 2000

// ============================================================
//                    OUTPUT CONFIGURATION
// ============================================================

#define BUZZER_PIN 23
#define WORKSPACE_LED_PIN 25

// ============================================================
//                    TIMING CONFIGURATION
// ============================================================

// PIR is checked every 100 ms
#define PIR_CHECK_INTERVAL 100UL

// Sensor/backend update every 500 ms
#define SENSOR_SEND_INTERVAL 2000UL

// WiFi reconnect interval
#define WIFI_RETRY_INTERVAL 10000UL

// Workspace LED ON delay
#define WORKSPACE_LED_ON_DELAY 20UL

// Buzzer timing
#define BUZZER_ON_TIME 5000UL
#define BUZZER_OFF_TIME 10000UL

// ============================================================
//                    SENSOR VARIABLES
// ============================================================

// Reception
float receptionTemperature = 0.0;
float receptionHumidity = 0.0;

// Workspace
float workspaceTemperature = 0.0;
float workspaceHumidity = 0.0;

// Manager Cabin
float managerTemperature = 0.0;
float managerHumidity = 0.0;

// MQ-2
int gasValue = 0;

// ============================================================
//                    PIR VARIABLES
// ============================================================

bool receptionMotion = false;
bool workspaceMotion = false;
bool managerMotion = false;

// Previous Workspace PIR state
bool previousWorkspaceMotion = false;

// Workspace motion event
bool workspaceMotionEvent = false;

// ============================================================
//                    WORKSPACE LED VARIABLES
// ============================================================

bool workspaceLEDState = false;

unsigned long workspaceMotionStartTime = 0;

// ============================================================
//                    TIMING VARIABLES
// ============================================================

unsigned long lastPIRCheck = 0;
unsigned long lastSensorSend = 0;
unsigned long lastWiFiRetry = 0;

// ============================================================
//                    BUZZER VARIABLES
// ============================================================

bool buzzerActive = false;
bool buzzerState = false;

unsigned long buzzerTimer = 0;

// ============================================================
//                    FUNCTION DECLARATIONS
// ============================================================

void connectWiFi();
void syncTime();

void readPIR();
void processWorkspacePIR();
void updateWorkspaceLED();

void readSensors();
void processGasWarning();
void processBuzzer();

void printSensorData();

void sendAllSensorData();

void sendSensorData(
  const char* roomID,
  float temperature,
  float humidity,
  int gasLevel,
  bool motionDetected
);

String getTimestamp();

// ============================================================
//                    SETUP
// ============================================================

void setup() {

  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println("================================================");
  Serial.println("       AI DIGITAL TWIN BUILDINGS");
  Serial.println("             ESP32 CONTROLLER");
  Serial.println("================================================");

  // ----------------------------------------------------------
  // GPIO CONFIGURATION
  // ----------------------------------------------------------

  pinMode(PIR_RECEPTION, INPUT);
  pinMode(PIR_WORKSPACE, INPUT);
  pinMode(PIR_MANAGER, INPUT);

  pinMode(MQ2_PIN, INPUT);

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(WORKSPACE_LED_PIN, OUTPUT);

  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(WORKSPACE_LED_PIN, LOW);

  // ----------------------------------------------------------
  // DHT INITIALIZATION
  // ----------------------------------------------------------

  dhtReception.begin();
  dhtWorkspace.begin();
  dhtManager.begin();

  Serial.println("DHT11 sensors initialized.");

  // ----------------------------------------------------------
  // WIFI
  // ----------------------------------------------------------

  connectWiFi();

  // ----------------------------------------------------------
  // TIME SYNCHRONIZATION
  // ----------------------------------------------------------

  syncTime();

  // ----------------------------------------------------------
  // PIR STABILIZATION
  // ----------------------------------------------------------

  Serial.println();
  Serial.println("Waiting for PIR sensors to stabilize...");
  delay(10000);

  readPIR();

  previousWorkspaceMotion = workspaceMotion;

  // Keep LED OFF during startup
  workspaceLEDState = false;
  workspaceMotionStartTime = 0;

  digitalWrite(WORKSPACE_LED_PIN, LOW);

  Serial.println("PIR sensors ready.");

  // ----------------------------------------------------------
  // INITIAL SENSOR READING
  // ----------------------------------------------------------

  readSensors();

  printSensorData();

  // ----------------------------------------------------------
  // SERVER TEST
  // ----------------------------------------------------------

  if (WiFi.status() == WL_CONNECTED) {

    HTTPClient http;

    String url = String(SERVER_URL) + "/docs";

    Serial.println();
    Serial.println("Testing FastAPI server...");

    http.begin(url);

    int httpCode = http.GET();

    if (httpCode > 0) {

      Serial.print("FastAPI server response: ");
      Serial.println(httpCode);

    } else {

      Serial.print("FastAPI connection failed: ");
      Serial.println(http.errorToString(httpCode));
    }

    http.end();
  }

  Serial.println();
  Serial.println("================================================");
  Serial.println("             SYSTEM READY");
  Serial.println("================================================");
}

// ============================================================
//                    MAIN LOOP
// ============================================================

void loop() {

  unsigned long currentMillis = millis();

  // ==========================================================
  // FAST PIR CHECK
  // ==========================================================

  if (currentMillis - lastPIRCheck >= PIR_CHECK_INTERVAL) {

    lastPIRCheck = currentMillis;

    // Read all PIR sensors
    readPIR();

    // Workspace-specific event detection
    processWorkspacePIR();

    // Workspace LED control
    updateWorkspaceLED();
  }

  // ==========================================================
  // SENSOR READING + BACKEND TRANSMISSION
  // ==========================================================

  if (currentMillis - lastSensorSend >= SENSOR_SEND_INTERVAL) {

    lastSensorSend = currentMillis;

    // Read DHT11 + MQ-2
    readSensors();

    // Check gas status
    processGasWarning();

    // Print sensor data
    printSensorData();

    // Send all three rooms
    sendAllSensorData();
  }

  // ==========================================================
  // BUZZER
  // ==========================================================

  processBuzzer();

  // ==========================================================
  // WIFI RECONNECTION
  // ==========================================================

  if (WiFi.status() != WL_CONNECTED) {

    if (currentMillis - lastWiFiRetry >= WIFI_RETRY_INTERVAL) {

      lastWiFiRetry = currentMillis;

      Serial.println();
      Serial.println("WiFi disconnected. Reconnecting...");

      connectWiFi();
    }
  }
}

// ============================================================
//                    WIFI CONNECTION
// ============================================================

void connectWiFi() {

  Serial.println();
  Serial.println("Connecting to WiFi...");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();

  while (
    WiFi.status() != WL_CONNECTED &&
    millis() - startAttempt < 15000
  ) {

    delay(500);

    Serial.print(".");
  }

  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("WiFi connected.");

    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());

    Serial.print("Server URL: ");
    Serial.println(SERVER_URL);

  } else {

    Serial.println("WiFi connection failed.");
  }
}

// ============================================================
//                    TIME SYNCHRONIZATION
// ============================================================

void syncTime() {

  Serial.println();
  Serial.println("Synchronizing time...");

  configTime(
    GMT_OFFSET_SEC,
    DAYLIGHT_OFFSET_SEC,
    "pool.ntp.org",
    "time.nist.gov"
  );

  struct tm timeinfo;

  if (getLocalTime(&timeinfo)) {

    Serial.println("Time synchronized.");

    Serial.print("Current time: ");
    Serial.println(
      &timeinfo,
      "%Y-%m-%d %H:%M:%S"
    );

  } else {

    Serial.println("Time synchronization failed.");
  }
}

// ============================================================
//                    GET TIMESTAMP
// ============================================================

String getTimestamp() {

  struct tm timeinfo;

  if (!getLocalTime(&timeinfo)) {

    return "";
  }

  char buffer[30];

  strftime(
    buffer,
    sizeof(buffer),
    "%Y-%m-%dT%H:%M:%S",
    &timeinfo
  );

  return String(buffer);
}

// ============================================================
//                    READ PIR SENSORS
// ============================================================

void readPIR() {

  // Reception PIR
  receptionMotion =
    digitalRead(PIR_RECEPTION) == HIGH;

  // Workspace PIR
  workspaceMotion =
    digitalRead(PIR_WORKSPACE) == HIGH;

  // Manager Cabin PIR
  managerMotion =
    digitalRead(PIR_MANAGER) == HIGH;
}

// ============================================================
//              WORKSPACE PIR EVENT DETECTION
// ============================================================

void processWorkspacePIR() {

  // ==========================================================
  // LOW → HIGH
  // ==========================================================

  if (
    workspaceMotion &&
    !previousWorkspaceMotion
  ) {

    workspaceMotionEvent = true;

    Serial.println();
    Serial.println(
      ">>> WORKSPACE PIR: MOTION DETECTED <<<"
    );
  }

  // ==========================================================
  // HIGH → LOW
  // ==========================================================

  if (
    !workspaceMotion &&
    previousWorkspaceMotion
  ) {

    workspaceMotionEvent = false;

    Serial.println();
    Serial.println(
      ">>> WORKSPACE PIR: AREA VACANT <<<"
    );
  }

  previousWorkspaceMotion = workspaceMotion;
}

// ============================================================
//              WORKSPACE LED CONTROL
// ============================================================
//
// Required behavior:
//
// Motion detected
//       ↓
// Wait 1 second
//       ↓
// LED ON
//
// Motion continues
//       ↓
// LED remains ON
//
// Motion stops
//       ↓
// LED OFF immediately
//
// ============================================================

void updateWorkspaceLED() {

  // ==========================================================
  // MOTION DETECTED
  // ==========================================================

  if (workspaceMotion) {

    // Start timer when motion first appears
    if (workspaceMotionStartTime == 0) {

      workspaceMotionStartTime = millis();
    }

    // --------------------------------------------------------
    // Turn LED ON after 1 second of continuous motion
    // --------------------------------------------------------

    if (
      !workspaceLEDState &&
      millis() - workspaceMotionStartTime >=
      WORKSPACE_LED_ON_DELAY
    ) {

      digitalWrite(
        WORKSPACE_LED_PIN,
        HIGH
      );

      workspaceLEDState = true;

      Serial.println(
        ">>> WORKSPACE LED: ON <<<"
      );
    }
  }

  // ==========================================================
  // NO MOTION
  // ==========================================================

  else {

    // Reset motion timer
    workspaceMotionStartTime = 0;

    // --------------------------------------------------------
    // Turn LED OFF immediately
    // --------------------------------------------------------

    if (workspaceLEDState) {

      digitalWrite(
        WORKSPACE_LED_PIN,
        LOW
      );

      workspaceLEDState = false;

      Serial.println(
        ">>> WORKSPACE LED: OFF <<<"
      );
    }
  }
}

// ============================================================
//                    READ DHT + MQ2
// ============================================================

void readSensors() {

  float temperature;
  float humidity;

  // ==========================================================
  // RECEPTION
  // ==========================================================

  temperature =
    dhtReception.readTemperature();

  humidity =
    dhtReception.readHumidity();

  if (!isnan(temperature)) {

    receptionTemperature =
      temperature;
  }

  if (!isnan(humidity)) {

    receptionHumidity =
      humidity;
  }

  // ==========================================================
  // WORKSPACE
  // ==========================================================

  temperature =
    dhtWorkspace.readTemperature();

  humidity =
    dhtWorkspace.readHumidity();

  if (!isnan(temperature)) {

    workspaceTemperature =
      temperature;
  }

  if (!isnan(humidity)) {

    workspaceHumidity =
      humidity;
  }

  // ==========================================================
  // MANAGER CABIN
  // ==========================================================

  temperature =
    dhtManager.readTemperature();

  humidity =
    dhtManager.readHumidity();

  if (!isnan(temperature)) {

    managerTemperature =
      temperature;
  }

  if (!isnan(humidity)) {

    managerHumidity =
      humidity;
  }

  // ==========================================================
  // MQ-2
  // ==========================================================

  gasValue = analogRead(MQ2_PIN);
}

// ============================================================
//                    GAS WARNING
// ============================================================

void processGasWarning() {

  Serial.println();

  Serial.print("MQ-2 Raw ADC: ");
  Serial.println(gasValue);

  if (
    gasValue >=
    GAS_CRITICAL_THRESHOLD
  ) {

    Serial.println(
      "GAS STATUS: CRITICAL"
    );

  } else if (
    gasValue >=
    GAS_WARNING_THRESHOLD
  ) {

    Serial.println(
      "GAS STATUS: WARNING"
    );

  } else {

    Serial.println(
      "GAS STATUS: NORMAL"
    );
  }
}

// ============================================================
//                    BUZZER CONTROL
// ============================================================

void processBuzzer() {

  unsigned long currentMillis =
    millis();

  // ==========================================================
  // CRITICAL GAS
  // ==========================================================

  if (
    gasValue >=
    GAS_CRITICAL_THRESHOLD
  ) {

    // Start buzzer cycle
    if (!buzzerActive) {

      buzzerActive = true;

      buzzerState = true;

      buzzerTimer =
        currentMillis;

      digitalWrite(
        BUZZER_PIN,
        HIGH
      );

      Serial.println();
      Serial.println(
        "!!! GAS CRITICAL - BUZZER ON !!!"
      );
    }

    // --------------------------------------------------------
    // BUZZER ON PERIOD
    // --------------------------------------------------------

    if (buzzerState) {

      if (
        currentMillis -
        buzzerTimer >=
        BUZZER_ON_TIME
      ) {

        buzzerState = false;

        buzzerTimer =
          currentMillis;

        digitalWrite(
          BUZZER_PIN,
          LOW
        );

        Serial.println(
          "Buzzer OFF - waiting..."
        );
      }
    }

    // --------------------------------------------------------
    // BUZZER OFF PERIOD
    // --------------------------------------------------------

    else {

      if (
        currentMillis -
        buzzerTimer >=
        BUZZER_OFF_TIME
      ) {

        buzzerState = true;

        buzzerTimer =
          currentMillis;

        digitalWrite(
          BUZZER_PIN,
          HIGH
        );

        Serial.println(
          "Buzzer ON - gas still critical."
        );
      }
    }
  }

  // ==========================================================
  // GAS SAFE
  // ==========================================================

  else {

    if (buzzerActive) {

      buzzerActive = false;

      buzzerState = false;

      digitalWrite(
        BUZZER_PIN,
        LOW
      );

      Serial.println();
      Serial.println(
        "Gas level safe - buzzer stopped."
      );
    }
  }
}

// ============================================================
//                    SERIAL MONITOR
// ============================================================

void printSensorData() {

  Serial.println();
  Serial.println(
    "================================================"
  );

  Serial.println(
    "                 SENSOR DATA"
  );

  Serial.println(
    "================================================"
  );

  // ==========================================================
  // RECEPTION
  // ==========================================================

  Serial.println();
  Serial.println("[RECEPTION]");

  Serial.print("Temperature: ");
  Serial.print(receptionTemperature);
  Serial.println(" °C");

  Serial.print("Humidity: ");
  Serial.print(receptionHumidity);
  Serial.println(" %");

  Serial.print("PIR Motion: ");

  Serial.println(
    receptionMotion
      ? "DETECTED / OCCUPIED"
      : "NO MOTION / VACANT"
  );

  // ==========================================================
  // WORKSPACE
  // ==========================================================

  Serial.println();
  Serial.println("[WORKSPACE]");

  Serial.print("Temperature: ");
  Serial.print(workspaceTemperature);
  Serial.println(" °C");

  Serial.print("Humidity: ");
  Serial.print(workspaceHumidity);
  Serial.println(" %");

  Serial.print("Gas ADC: ");
  Serial.println(gasValue);

  Serial.print("PIR Motion: ");

  Serial.println(
    workspaceMotion
      ? "DETECTED / OCCUPIED"
      : "NO MOTION / VACANT"
  );

  Serial.print("Workspace LED: ");

  Serial.println(
    workspaceLEDState
      ? "ON"
      : "OFF"
  );

  // ==========================================================
  // MANAGER CABIN
  // ==========================================================

  Serial.println();
  Serial.println("[MANAGER CABIN]");

  Serial.print("Temperature: ");
  Serial.print(managerTemperature);
  Serial.println(" °C");

  Serial.print("Humidity: ");
  Serial.print(managerHumidity);
  Serial.println(" %");

  Serial.print("PIR Motion: ");

  Serial.println(
    managerMotion
      ? "DETECTED / OCCUPIED"
      : "NO MOTION / VACANT"
  );

  // ==========================================================
  // SYSTEM
  // ==========================================================

  Serial.println();
  Serial.println("[SYSTEM]");

  Serial.print("WiFi: ");

  if (
    WiFi.status() ==
    WL_CONNECTED
  ) {

    Serial.println("CONNECTED");

  } else {

    Serial.println("DISCONNECTED");
  }

  Serial.print("IP: ");

  if (
    WiFi.status() ==
    WL_CONNECTED
  ) {

    Serial.println(
      WiFi.localIP()
    );

  } else {

    Serial.println("N/A");
  }

  Serial.print("Timestamp: ");
  Serial.println(
    getTimestamp()
  );

  Serial.println(
    "================================================"
  );
}

// ============================================================
//                    SEND ALL ROOM DATA
// ============================================================

void sendAllSensorData() {

  if (
    WiFi.status() !=
    WL_CONNECTED
  ) {

    Serial.println(
      "Cannot send sensor data - WiFi disconnected."
    );

    return;
  }

  // ==========================================================
  // RECEPTION
  // ==========================================================

  sendSensorData(
    "RECEPTION",
    receptionTemperature,
    receptionHumidity,
    0,
    receptionMotion
  );

  // ==========================================================
  // WORKSPACE
  // ==========================================================

  sendSensorData(
    "WORKSPACE",
    workspaceTemperature,
    workspaceHumidity,
    gasValue,
    workspaceMotion
  );

  // ==========================================================
  // MANAGER CABIN
  // ==========================================================

  sendSensorData(
    "MANAGER_CABIN",
    managerTemperature,
    managerHumidity,
    0,
    managerMotion
  );
}

// ============================================================
//                    SEND SENSOR DATA
// ============================================================

void sendSensorData(
  const char* roomID,
  float temperature,
  float humidity,
  int gasLevel,
  bool motionDetected
) {

  if (
    WiFi.status() !=
    WL_CONNECTED
  ) {

    return;
  }

  HTTPClient http;

  String url =
    String(SERVER_URL) +
    SENSOR_ENDPOINT;

  http.begin(url);

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  // ==========================================================
  // JSON DOCUMENT
  // ==========================================================

  StaticJsonDocument<512> json;

  json["room_id"] =
    roomID;

  json["temperature"] =
    temperature;

  json["humidity"] =
    humidity;

  json["gas_level"] =
    gasLevel;

  json["motion_detected"] =
    motionDetected;

  json["timestamp"] =
    getTimestamp();

  String requestBody;

  serializeJson(
    json,
    requestBody
  );

  // ==========================================================
  // HTTP POST
  // ==========================================================

  int httpCode =
    http.POST(requestBody);

  Serial.println();

  Serial.print(
    "Sending "
  );

  Serial.print(roomID);

  Serial.println(
    " data..."
  );

  Serial.print(
    "Payload: "
  );

  Serial.println(
    requestBody
  );

  if (httpCode > 0) {

    Serial.print(
      "HTTP Response Code: "
    );

    Serial.println(
      httpCode
    );

    String response =
      http.getString();

    Serial.print(
      "Server Response: "
    );

    Serial.println(
      response
    );

  } else {

    Serial.print(
      "HTTP POST failed: "
    );

    Serial.println(
      http.errorToString(httpCode)
    );
  }

  http.end();
}
import { useEffect, useMemo, useState } from "react";

import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

import {
    ArrowBack,
    Air,
    Circle,
    DeviceThermostat,
    Groups,
    Sensors,
    WaterDrop,
} from "@mui/icons-material";

import Layout from "../components/Layout";
import { getRoomPrediction } from "../api/api";


/* =========================================================
   ROOM CONFIGURATION
========================================================= */

const ROOM_IDS = [
    "RECEPTION",
    "WORKSPACE",
    "MANAGER_CABIN",
];


/* =========================================================
   HELPERS
========================================================= */

const getStatusColor = (status) => {
    switch (status) {
        case "Critical":
            return "error";

        case "Warning":
            return "warning";

        default:
            return "success";
    }
};


const formatNumber = (value, decimals = 1) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "--";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return "--";
    }

    return number.toFixed(decimals);
};


/* =========================================================
   SENSOR VALUE CARD
========================================================= */

function SensorValue({
    icon,
    label,
    value,
    unit = "",
    description = "",
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                height: "100%",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
            }}
        >
            <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
            >
                <Box
                    sx={{
                        width: 44,
                        height: 44,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "action.hover",
                    }}
                >
                    {icon}
                </Box>

                <Box sx={{ minWidth: 0 }}>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        {label}
                    </Typography>

                    <Typography
                        variant="h6"
                        fontWeight={700}
                    >
                        {value}

                        {unit && (
                            <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ ml: 0.5 }}
                            >
                                {unit}
                            </Typography>
                        )}
                    </Typography>

                    {description && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {description}
                        </Typography>
                    )}
                </Box>
            </Stack>
        </Paper>
    );
}


/* =========================================================
   DIGITAL TWIN PREVIEW
========================================================= */

function DigitalTwinPreview({ room }) {
    const occupied =
        room?.prediction === "Occupied" ||
        room?.occupancy === "Occupied" ||
        room?.motion_detected === true;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 2.5,
                height: "100%",
                minHeight: 420,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
            }}
        >
            <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
            >
                <Box>
                    <Typography
                        variant="subtitle1"
                        fontWeight={700}
                    >
                        Room Digital Twin
                    </Typography>

                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        Real-time room state visualization
                    </Typography>
                </Box>

                <Chip
                    size="small"
                    icon={<Sensors />}
                    label="LIVE"
                    color="success"
                    variant="outlined"
                />
            </Stack>

            <Box
                sx={{
                    position: "relative",
                    height: 330,
                    border: "2px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    backgroundColor: "action.hover",
                    overflow: "hidden",
                }}
            >
                {/* Room label */}
                <Box
                    sx={{
                        position: "absolute",
                        top: 14,
                        left: 16,
                        px: 1.2,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: "background.paper",
                        border: "1px solid",
                        borderColor: "divider",
                    }}
                >
                    <Typography
                        variant="caption"
                        fontWeight={700}
                    >
                        {room?.room_id || "ROOM"}
                    </Typography>
                </Box>

                {/* Temperature sensor */}
                <Box
                    sx={{
                        position: "absolute",
                        left: "7%",
                        top: "17%",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                    }}
                >
                    <Circle
                        sx={{
                            fontSize: 12,
                            color: "warning.main",
                        }}
                    />

                    <Typography variant="caption">
                        TEMP
                    </Typography>
                </Box>

                {/* Humidity sensor */}
                <Box
                    sx={{
                        position: "absolute",
                        right: "8%",
                        top: "15%",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                    }}
                >
                    <Circle
                        sx={{
                            fontSize: 12,
                            color: "info.main",
                        }}
                    />

                    <Typography variant="caption">
                        HUMIDITY
                    </Typography>
                </Box>

                {/* PIR sensor */}
                <Box
                    sx={{
                        position: "absolute",
                        left: "50%",
                        top: "9%",
                        transform: "translateX(-50%)",
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                    }}
                >
                    <Circle
                        sx={{
                            fontSize: 12,
                            color: occupied
                                ? "success.main"
                                : "text.disabled",
                        }}
                    />

                    <Typography variant="caption">
                        PIR
                    </Typography>
                </Box>

                {/* Desk */}
                <Box
                    sx={{
                        position: "absolute",
                        left: "16%",
                        top: "28%",
                        width: "30%",
                        height: 65,
                        border: "2px solid",
                        borderColor: "text.secondary",
                        borderRadius: 1,
                        backgroundColor: "background.paper",
                    }}
                >
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform:
                                "translate(-50%, -50%)",
                        }}
                    >
                        WORK DESK
                    </Typography>
                </Box>

                {/* Chair */}
                <Box
                    sx={{
                        position: "absolute",
                        left: "27%",
                        top: "51%",
                        width: 65,
                        height: 42,
                        border: "2px solid",
                        borderColor: "text.secondary",
                        borderRadius: 1,
                        backgroundColor: "background.paper",
                    }}
                />

                {/* Table */}
                <Box
                    sx={{
                        position: "absolute",
                        right: "13%",
                        top: "27%",
                        width: "25%",
                        height: 90,
                        border: "2px solid",
                        borderColor: "text.secondary",
                        borderRadius: 1,
                        backgroundColor: "background.paper",
                    }}
                >
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform:
                                "translate(-50%, -50%)",
                        }}
                    >
                        TABLE
                    </Typography>
                </Box>

                {/* Door */}
                <Box
                    sx={{
                        position: "absolute",
                        right: 0,
                        bottom: "18%",
                        width: 48,
                        height: 95,
                        border: "2px solid",
                        borderRight: 0,
                        borderColor: "text.secondary",
                        backgroundColor: "background.paper",
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform:
                                "translate(-50%, -50%) rotate(-90deg)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        DOOR
                    </Typography>
                </Box>

                {/* Person indicator */}
                {occupied && (
                    <Box
                        sx={{
                            position: "absolute",
                            left: "51%",
                            top: "56%",
                            transform:
                                "translate(-50%, -50%)",
                            width: 72,
                            height: 72,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "success.main",
                            color: "success.contrastText",
                            boxShadow: 3,
                        }}
                    >
                        <Groups />
                    </Box>
                )}

                {/* PIR state */}
                <Box
                    sx={{
                        position: "absolute",
                        left: 16,
                        bottom: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.7,
                    }}
                >
                    <Circle
                        sx={{
                            fontSize: 10,
                            color: occupied
                                ? "success.main"
                                : "text.disabled",
                        }}
                    />

                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        PIR:
                    </Typography>

                    <Typography
                        variant="caption"
                        fontWeight={700}
                    >
                        {occupied
                            ? "Motion detected"
                            : "No motion"}
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
}


/* =========================================================
   ROOM CARD
========================================================= */

function RoomCard({ room, onOpen }) {
    const roomName =
        room?.room_id || "Unknown Room";

    const occupancy =
        room?.prediction ||
        room?.occupancy ||
        (room?.motion_detected
            ? "Occupied"
            : "Vacant");

    const status =
        room?.status || "Normal";

    return (
        <Paper
            elevation={0}
            sx={{
                height: "100%",
                p: 2.5,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 3,
                transition: "all 0.2s ease",

                "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: 3,
                    transform: "translateY(-2px)",
                },
            }}
        >
            <Stack spacing={2}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                >
                    <Box>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                        >
                            {roomName}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Building room
                        </Typography>
                    </Box>

                    <Chip
                        label={status}
                        color={getStatusColor(status)}
                        size="small"
                    />
                </Stack>

                <Divider />

                <Stack spacing={1.5}>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Occupancy
                        </Typography>

                        <Chip
                            label={occupancy}
                            color={
                                occupancy === "Occupied"
                                    ? "success"
                                    : "default"
                            }
                            size="small"
                            variant="outlined"
                        />
                    </Stack>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                    >
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Temperature
                        </Typography>

                        <Typography fontWeight={600}>
                            {formatNumber(
                                room?.temperature
                            )}{" "}
                            °C
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                    >
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Humidity
                        </Typography>

                        <Typography fontWeight={600}>
                            {formatNumber(
                                room?.humidity
                            )}{" "}
                            %
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                    >
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Gas Level
                        </Typography>

                        <Typography fontWeight={600}>
                            {formatNumber(
                                room?.gas_level,
                                0
                            )}
                        </Typography>
                    </Stack>

                    <Stack
                        direction="row"
                        justifyContent="space-between"
                    >
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Risk Score
                        </Typography>

                        <Typography fontWeight={700}>
                            {room?.risk_score ?? 0}/100
                        </Typography>
                    </Stack>
                </Stack>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => onOpen(room)}
                    sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 700,
                    }}
                >
                    Enter Digital Twin
                </Button>
            </Stack>
        </Paper>
    );
}


/* =========================================================
   ROOM SPOTLIGHT
========================================================= */

function RoomSpotlight({ room, onBack }) {
    const roomName =
        room?.room_id || "Unknown Room";

    const occupancy =
        room?.prediction ||
        room?.occupancy ||
        (room?.motion_detected
            ? "Occupied"
            : "Vacant");

    const status =
        room?.status || "Normal";

    const mlPrediction =
        room?.ml_prediction || "--";

    const mlConfidence =
        room?.ml_confidence !== null &&
            room?.ml_confidence !== undefined
            ? `${formatNumber(
                room.ml_confidence,
                2
            )}%`
            : "--";

    const riskScore =
        room?.risk_score ?? 0;

    const reasons =
        Array.isArray(room?.reasons)
            ? room.reasons
            : [];

    const suggestedAction =
        room?.suggested_action ||
        "Continue monitoring the room conditions.";

    const motionDetected =
        room?.motion_detected === true;

    return (
        <Stack spacing={3}>
            {/* Header */}
            <Stack
                direction={{
                    xs: "column",
                    sm: "row",
                }}
                alignItems={{
                    xs: "flex-start",
                    sm: "center",
                }}
                justifyContent="space-between"
                spacing={2}
            >
                <Stack
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                >
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={onBack}
                        sx={{
                            borderRadius: 2,
                            textTransform: "none",
                        }}
                    >
                        Back to Rooms
                    </Button>

                    <Box>
                        <Typography
                            variant="h5"
                            fontWeight={800}
                        >
                            {roomName}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Digital Twin Room View
                        </Typography>
                    </Box>
                </Stack>

                <Chip
                    icon={
                        <Circle
                            sx={{ fontSize: 10 }}
                        />
                    }
                    label="LIVE"
                    color="success"
                    variant="outlined"
                />
            </Stack>

            {/* Digital Twin + Current State */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 7 }}>
                    <DigitalTwinPreview
                        room={room}
                    />
                </Grid>

                <Grid size={{ xs: 12, lg: 5 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            height: "100%",
                            minHeight: 420,
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 3,
                        }}
                    >
                        <Typography
                            variant="h6"
                            fontWeight={700}
                            mb={2}
                        >
                            Current State
                        </Typography>

                        <Stack spacing={2.5}>
                            <Box>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    mb={0.7}
                                >
                                    Occupancy
                                </Typography>

                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                    flexWrap="wrap"
                                >
                                    <Chip
                                        label={occupancy}
                                        color={
                                            occupancy ===
                                                "Occupied"
                                                ? "success"
                                                : "default"
                                        }
                                        sx={{
                                            fontWeight: 700,
                                        }}
                                    />

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        {motionDetected
                                            ? "PIR detected"
                                            : "No PIR motion"}
                                    </Typography>
                                </Stack>
                            </Box>

                            <Divider />

                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                >
                                    <DeviceThermostat color="warning" />

                                    <Typography>
                                        Temperature
                                    </Typography>
                                </Stack>

                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                >
                                    {formatNumber(
                                        room?.temperature
                                    )}{" "}
                                    °C
                                </Typography>
                            </Stack>

                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                >
                                    <WaterDrop color="info" />

                                    <Typography>
                                        Humidity
                                    </Typography>
                                </Stack>

                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                >
                                    {formatNumber(
                                        room?.humidity
                                    )}{" "}
                                    %
                                </Typography>
                            </Stack>

                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                >
                                    <Air color="error" />

                                    <Typography>
                                        Gas Level
                                    </Typography>
                                </Stack>

                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                >
                                    {formatNumber(
                                        room?.gas_level,
                                        0
                                    )}
                                </Typography>
                            </Stack>

                            <Divider />

                            <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Typography color="text.secondary">
                                    Room Status
                                </Typography>

                                <Chip
                                    label={status}
                                    color={getStatusColor(
                                        status
                                    )}
                                    size="small"
                                />
                            </Stack>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>

            {/* AI Analysis */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                }}
            >
                <Stack
                    direction={{
                        xs: "column",
                        md: "row",
                    }}
                    justifyContent="space-between"
                    spacing={2}
                >
                    <Box>
                        <Typography
                            variant="h6"
                            fontWeight={700}
                        >
                            AI Room Analysis
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Sensor-driven occupancy and
                            anomaly analysis
                        </Typography>
                    </Box>

                    <Chip
                        label={`Risk ${riskScore}/100`}
                        color={getStatusColor(status)}
                        sx={{
                            fontWeight: 700,
                            alignSelf: {
                                xs: "flex-start",
                                md: "center",
                            },
                        }}
                    />
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                backgroundColor:
                                    "action.hover",
                            }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Occupancy Prediction
                            </Typography>

                            <Typography
                                variant="h6"
                                fontWeight={700}
                                mt={0.5}
                            >
                                {occupancy}
                            </Typography>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Source:{" "}
                                {room?.occupancy_source ||
                                    "PIR sensor"}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                backgroundColor:
                                    "action.hover",
                            }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                ML Prediction
                            </Typography>

                            <Typography
                                variant="h6"
                                fontWeight={700}
                                mt={0.5}
                            >
                                {mlPrediction}
                            </Typography>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Confidence:{" "}
                                {mlConfidence}
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                backgroundColor:
                                    "action.hover",
                            }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Anomaly Status
                            </Typography>

                            <Typography
                                variant="h6"
                                fontWeight={700}
                                mt={0.5}
                            >
                                {status}
                            </Typography>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Risk score:{" "}
                                {riskScore}/100
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>

                {reasons.length > 0 && (
                    <Box sx={{ mt: 2.5 }}>
                        <Typography
                            variant="subtitle2"
                            fontWeight={700}
                            mb={1}
                        >
                            Detected Conditions
                        </Typography>

                        <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                        >
                            {reasons.map(
                                (reason, index) => (
                                    <Chip
                                        key={`${reason}-${index}`}
                                        label={reason}
                                        size="small"
                                        color={
                                            status ===
                                                "Critical"
                                                ? "error"
                                                : "warning"
                                        }
                                        variant="outlined"
                                    />
                                )
                            )}
                        </Stack>
                    </Box>
                )}
            </Paper>

            {/* Suggested Action */}
            <Alert
                severity={
                    status === "Critical"
                        ? "error"
                        : status === "Warning"
                            ? "warning"
                            : "success"
                }
                sx={{
                    borderRadius: 3,
                    alignItems: "flex-start",
                }}
            >
                <Typography
                    variant="subtitle2"
                    fontWeight={700}
                >
                    Suggested Action
                </Typography>

                <Typography variant="body2">
                    {suggestedAction}
                </Typography>
            </Alert>

            {/* Live Sensor Data */}
            <Box>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    mb={2}
                >
                    Live Sensor Data
                </Typography>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <SensorValue
                            icon={
                                <DeviceThermostat color="warning" />
                            }
                            label="Temperature"
                            value={formatNumber(
                                room?.temperature
                            )}
                            unit="°C"
                            description="DHT sensor"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <SensorValue
                            icon={
                                <WaterDrop color="info" />
                            }
                            label="Humidity"
                            value={formatNumber(
                                room?.humidity
                            )}
                            unit="%"
                            description="DHT sensor"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <SensorValue
                            icon={<Air color="error" />}
                            label="Gas Level"
                            value={formatNumber(
                                room?.gas_level,
                                0
                            )}
                            description="MQ-2 raw ADC"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <SensorValue
                            icon={
                                <Sensors color="success" />
                            }
                            label="PIR Motion"
                            value={
                                motionDetected
                                    ? "Detected"
                                    : "Not Detected"
                            }
                            description="Occupancy source"
                        />
                    </Grid>
                </Grid>
            </Box>

            {/* Sensor Visualization */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                }}
            >
                <Typography
                    variant="h6"
                    fontWeight={700}
                >
                    Live Sensor Visualization
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    mb={3}
                >
                    Current sensor values received from
                    the physical room
                </Typography>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                backgroundColor:
                                    "action.hover",
                            }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Temperature
                            </Typography>

                            <Typography
                                variant="h4"
                                fontWeight={800}
                            >
                                {formatNumber(
                                    room?.temperature
                                )}

                                <Typography
                                    component="span"
                                    variant="body1"
                                    color="text.secondary"
                                >
                                    {" "}
                                    °C
                                </Typography>
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                backgroundColor:
                                    "action.hover",
                            }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Humidity
                            </Typography>

                            <Typography
                                variant="h4"
                                fontWeight={800}
                            >
                                {formatNumber(
                                    room?.humidity
                                )}

                                <Typography
                                    component="span"
                                    variant="body1"
                                    color="text.secondary"
                                >
                                    {" "}
                                    %
                                </Typography>
                            </Typography>
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box
                            sx={{
                                p: 2.5,
                                borderRadius: 2,
                                backgroundColor:
                                    "action.hover",
                            }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Gas Level
                            </Typography>

                            <Typography
                                variant="h4"
                                fontWeight={800}
                            >
                                {formatNumber(
                                    room?.gas_level,
                                    0
                                )}
                            </Typography>

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Raw MQ-2 ADC reading
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Stack>
    );
}


/* =========================================================
   MAIN ROOMS PAGE
========================================================= */

export default function Rooms() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedRoomId, setSelectedRoomId] =
        useState(null);


    /* -----------------------------------------------------
       LOAD ALL ROOM PREDICTIONS
    ----------------------------------------------------- */

    const loadRooms = async () => {
        try {
            setError("");

            const results =
                await Promise.all(
                    ROOM_IDS.map(async (roomId) => {
                        try {
                            return await getRoomPrediction(
                                roomId
                            );
                        } catch (error) {
                            console.error(
                                `Failed to load ${roomId}:`,
                                error
                            );

                            return null;
                        }
                    })
                );

            const validRooms =
                results.filter(
                    (room) => room !== null
                );

            setRooms(validRooms);

            if (validRooms.length === 0) {
                setError(
                    "No room prediction data is available."
                );
            }
        } catch (error) {
            console.error(
                "Failed to load rooms:",
                error
            );

            setError(
                "Unable to load room data from the backend."
            );
        } finally {
            setLoading(false);
        }
    };


    /* -----------------------------------------------------
       INITIAL LOAD + AUTO REFRESH
    ----------------------------------------------------- */

    useEffect(() => {
        loadRooms();

        const interval = setInterval(() => {
            loadRooms();
        }, 10000);

        return () => {
            clearInterval(interval);
        };
    }, []);


    /* -----------------------------------------------------
       SELECTED ROOM
    ----------------------------------------------------- */

    const selectedRoom = useMemo(() => {
        if (!selectedRoomId) {
            return null;
        }

        return (
            rooms.find(
                (room) =>
                    room?.room_id ===
                    selectedRoomId
            ) || null
        );
    }, [rooms, selectedRoomId]);


    /* =====================================================
       LOADING
    ===================================================== */

    if (loading) {
        return (
            <Layout>
                <Box
                    sx={{
                        minHeight: "60vh",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Stack
                        spacing={2}
                        alignItems="center"
                    >
                        <CircularProgress />

                        <Typography color="text.secondary">
                            Loading room data...
                        </Typography>
                    </Stack>
                </Box>
            </Layout>
        );
    }


    /* =====================================================
       DIGITAL TWIN VIEW
    ===================================================== */

    if (selectedRoomId && selectedRoom) {
        return (
            <Layout>
                <RoomSpotlight
                    room={selectedRoom}
                    onBack={() =>
                        setSelectedRoomId(null)
                    }
                />
            </Layout>
        );
    }


    /* =====================================================
       ROOMS LIST
    ===================================================== */

    return (
        <Layout>
            <Stack spacing={3}>
                {/* Header */}
                <Stack
                    direction={{
                        xs: "column",
                        sm: "row",
                    }}
                    justifyContent="space-between"
                    alignItems={{
                        xs: "flex-start",
                        sm: "center",
                    }}
                    spacing={2}
                >
                    <Box>
                        <Typography
                            variant="h4"
                            fontWeight={800}
                        >
                            Rooms
                        </Typography>

                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                        >
                            Monitor and explore each room
                            through its digital twin.
                        </Typography>
                    </Box>

                    <Chip
                        icon={
                            <Circle
                                sx={{
                                    fontSize: 10,
                                }}
                            />
                        }
                        label="Live Monitoring"
                        color="success"
                        variant="outlined"
                    />
                </Stack>


                {/* Error */}
                {error && (
                    <Alert
                        severity="error"
                        action={
                            <Button
                                color="inherit"
                                size="small"
                                onClick={loadRooms}
                            >
                                Retry
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}


                {/* Empty state */}
                {!error &&
                    rooms.length === 0 && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 5,
                                textAlign: "center",
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 3,
                            }}
                        >
                            <Sensors
                                sx={{
                                    fontSize: 48,
                                    color: "text.secondary",
                                    mb: 1,
                                }}
                            />

                            <Typography
                                variant="h6"
                                fontWeight={700}
                            >
                                No rooms available
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Waiting for room data
                                from the backend.
                            </Typography>
                        </Paper>
                    )}


                {/* Room cards */}
                {rooms.length > 0 && (
                    <Grid container spacing={3}>
                        {rooms.map((room) => {
                            const roomId =
                                room?.room_id;

                            return (
                                <Grid
                                    key={roomId}
                                    size={{
                                        xs: 12,
                                        sm: 6,
                                        lg: 4,
                                    }}
                                >
                                    <RoomCard
                                        room={room}
                                        onOpen={() =>
                                            setSelectedRoomId(
                                                roomId
                                            )
                                        }
                                    />
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </Stack>
        </Layout>
    );
}
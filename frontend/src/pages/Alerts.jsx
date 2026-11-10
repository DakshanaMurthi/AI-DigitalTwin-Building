import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Stack,
    Typography,
} from "@mui/material";

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import Layout from "../components/Layout";

import { getDashboardRooms } from "../api/dashboardApi";
import { getRoomPrediction } from "../api/api";

import { useBuilding } from "../contexts/useBuilding";


/* =========================================================
   HELPERS
========================================================= */

function getBuildingId(room) {
    return (
        room?.building_id ??
        room?.buildingId ??
        room?.building?.building_id ??
        room?.building?.id ??
        ""
    );
}


/*
 * IMPORTANT:
 *
 * getRoomPrediction() already returns:
 *
 * response.data.data
 *
 * Therefore this function receives the actual
 * prediction object directly.
 */
function normalizePrediction(response) {
    const data = response ?? {};

    return {
        prediction:
            data.prediction ?? null,

        confidence:
            data.confidence ?? null,

        riskScore:
            data.risk_score ??
            data.riskScore ??
            0,

        status:
            data.status ??
            "Normal",

        reasons:
            Array.isArray(data.reasons)
                ? data.reasons
                : [],

        action:
            data.suggested_action ??
            data.action ??
            null,

        timestamp:
            data.timestamp ??
            null,

        temperature:
            data.temperature ?? null,

        humidity:
            data.humidity ?? null,

        gasLevel:
            data.gas_level ??
            data.gasLevel ??
            null,

        motionDetected:
            data.motion_detected ??
            data.motionDetected ??
            null,
    };
}


function normalizeStatus(status) {
    const value =
        String(status || "")
            .trim()
            .toLowerCase();

    if (value === "critical") {
        return "critical";
    }

    if (value === "warning") {
        return "warning";
    }

    return "normal";
}


function getStatusColor(status) {
    if (status === "critical") {
        return "error";
    }

    if (status === "warning") {
        return "warning";
    }

    return "success";
}


function getStatusIcon(status) {
    if (status === "critical") {
        return (
            <ErrorIcon fontSize="small" />
        );
    }

    if (status === "warning") {
        return (
            <WarningAmberIcon
                fontSize="small"
            />
        );
    }

    return (
        <CheckCircleIcon
            fontSize="small"
        />
    );
}


function getStatusLabel(status) {
    if (status === "critical") {
        return "Critical";
    }

    if (status === "warning") {
        return "Warning";
    }

    return "Normal";
}


function formatTimestamp(timestamp) {
    if (!timestamp) {
        return "Latest AI analysis";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "Latest AI analysis";
    }

    return date.toLocaleString();
}


/* =========================================================
   ALERTS PAGE
========================================================= */

function Alerts() {
    const {
        selectedBuildingId,
    } = useBuilding();

    const [rooms, setRooms] = useState([]);
    const [predictions, setPredictions] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    /* =====================================================
       LOAD ROOMS + AI PREDICTIONS
    ===================================================== */

    const loadAlerts = useCallback(async () => {
        try {
            setError("");

            const response =
                await getDashboardRooms();

            const apiData =
                response?.data ??
                response ??
                [];

            const roomData =
                Array.isArray(apiData)
                    ? apiData
                    : Array.isArray(apiData?.data)
                        ? apiData.data
                        : Array.isArray(apiData?.rooms)
                            ? apiData.rooms
                            : [];

            setRooms(roomData);

            const results = {};

            await Promise.all(
                roomData.map(async (room) => {
                    if (!room?.room_id) {
                        return;
                    }

                    try {
                        /*
                         * getRoomPrediction already returns
                         * response.data.data.
                         */
                        const predictionResponse =
                            await getRoomPrediction(
                                room.room_id
                            );

                        const prediction =
                            normalizePrediction(
                                predictionResponse
                            );

                        results[room.room_id] =
                            prediction;

                    } catch (predictionError) {
                        console.error(
                            `Prediction error for ${room.room_id}:`,
                            predictionError
                        );

                        /*
                         * Fallback to dashboard room data.
                         */
                        results[room.room_id] = {
                            prediction: null,

                            confidence: null,

                            riskScore:
                                room.risk_score ??
                                room.ai_risk_score ??
                                0,

                            status:
                                room.status ??
                                "Normal",

                            reasons:
                                Array.isArray(
                                    room.reasons
                                )
                                    ? room.reasons
                                    : [],

                            action:
                                room.suggested_action ??
                                room.action ??
                                null,

                            timestamp:
                                room.timestamp ??
                                room.updated_at ??
                                null,

                            temperature:
                                room.temperature ??
                                null,

                            humidity:
                                room.humidity ??
                                null,

                            gasLevel:
                                room.gas_level ??
                                null,

                            motionDetected:
                                room.motion_detected ??
                                null,
                        };
                    }
                })
            );

            setPredictions(results);

        } catch (err) {
            console.error(
                "Unable to load alerts:",
                err
            );

            setError(
                "Unable to load alert information. Please check the backend connection."
            );
        } finally {
            setLoading(false);
        }
    }, []);


    /* =====================================================
       AUTO REFRESH
    ===================================================== */

    useEffect(() => {
        loadAlerts();

        const interval = setInterval(
            loadAlerts,
            10000
        );

        return () => {
            clearInterval(interval);
        };
    }, [loadAlerts]);


    /* =====================================================
       BUILDING FILTER
    ===================================================== */

    const displayedRooms = useMemo(() => {
        if (!selectedBuildingId) {
            return rooms;
        }

        return rooms.filter(
            (room) =>
                String(getBuildingId(room)) ===
                String(selectedBuildingId)
        );
    }, [
        rooms,
        selectedBuildingId,
    ]);


    /* =====================================================
       CREATE ACTIVE ALERT LIST
    ===================================================== */

    const alertRooms = useMemo(() => {
        return displayedRooms
            .map((room) => {
                const ai =
                    predictions[room.room_id] || {};

                /*
                 * AI prediction status is the primary
                 * source of truth.
                 */
                const status =
                    normalizeStatus(
                        ai.status ??
                        room.status
                    );

                return {
                    ...room,

                    roomName:
                        room.room_name ||
                        room.room_id ||
                        "Unknown Room",

                    temperature:
                        ai.temperature ??
                        room.temperature ??
                        room.latest_sensor?.temperature ??
                        0,

                    humidity:
                        ai.humidity ??
                        room.humidity ??
                        room.latest_sensor?.humidity ??
                        0,

                    gasLevel:
                        ai.gasLevel ??
                        room.gas_level ??
                        room.latest_sensor?.gas_level ??
                        0,

                    motionDetected:
                        ai.motionDetected ??
                        room.motion_detected ??
                        room.latest_sensor?.motion_detected ??
                        false,

                    status,

                    riskScore:
                        Number(
                            ai.riskScore ??
                            room.risk_score ??
                            room.ai_risk_score ??
                            0
                        ),

                    prediction:
                        ai.prediction ??
                        null,

                    confidence:
                        ai.confidence ??
                        null,

                    reasons:
                        Array.isArray(ai.reasons)
                            ? ai.reasons
                            : [],

                    action:
                        ai.action ??
                        null,

                    timestamp:
                        ai.timestamp ??
                        room.timestamp ??
                        room.updated_at ??
                        null,
                };
            })
            .filter(
                (room) =>
                    room.status === "warning" ||
                    room.status === "critical"
            );
    }, [
        displayedRooms,
        predictions,
    ]);


    /* =====================================================
       COUNTS
    ===================================================== */

    const criticalCount =
        alertRooms.filter(
            (room) =>
                room.status === "critical"
        ).length;

    const warningCount =
        alertRooms.filter(
            (room) =>
                room.status === "warning"
        ).length;


    /* =====================================================
       RENDER
    ===================================================== */

    return (
        <Layout>
            <Box
                sx={{
                    width: "100%",
                    maxWidth: 1600,
                    mx: "auto",
                }}
            >
                <Typography
                    variant="h4"
                    fontWeight={800}
                    sx={{
                        color: "#0F172A",
                    }}
                >
                    Alerts
                </Typography>

                <Typography
                    color="text.secondary"
                    sx={{
                        mt: 0.75,
                        mb: 3,
                    }}
                >
                    Monitor warning and critical
                    conditions in the building.
                </Typography>


                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                    >
                        {error}
                    </Alert>
                )}


                {/* =================================================
                    SUMMARY CARDS
                ================================================= */}

                <Grid
                    container
                    spacing={3}
                    mb={3}
                >
                    <Grid
                        size={{
                            xs: 12,
                            sm: 4,
                        }}
                    >
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary">
                                    Total Active Alerts
                                </Typography>

                                <Typography
                                    variant="h4"
                                    fontWeight={700}
                                    mt={1}
                                >
                                    {loading
                                        ? "—"
                                        : alertRooms.length}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>


                    <Grid
                        size={{
                            xs: 12,
                            sm: 4,
                        }}
                    >
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary">
                                    Warning Alerts
                                </Typography>

                                <Typography
                                    variant="h4"
                                    fontWeight={700}
                                    color="warning.main"
                                    mt={1}
                                >
                                    {loading
                                        ? "—"
                                        : warningCount}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>


                    <Grid
                        size={{
                            xs: 12,
                            sm: 4,
                        }}
                    >
                        <Card>
                            <CardContent>
                                <Typography color="text.secondary">
                                    Critical Alerts
                                </Typography>

                                <Typography
                                    variant="h4"
                                    fontWeight={700}
                                    color="error.main"
                                    mt={1}
                                >
                                    {loading
                                        ? "—"
                                        : criticalCount}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>


                {/* =================================================
                    ACTIVE ALERTS
                ================================================= */}

                <Card>
                    <CardContent>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                        >
                            <Typography
                                variant="h6"
                                fontWeight={600}
                            >
                                Active Alerts
                            </Typography>

                            {!loading && (
                                <Chip
                                    label={`${alertRooms.length} Active`}
                                    color={
                                        alertRooms.length > 0
                                            ? "error"
                                            : "success"
                                    }
                                    size="small"
                                />
                            )}
                        </Stack>


                        <Divider
                            sx={{ mb: 2 }}
                        />


                        {loading ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    py: 5,
                                }}
                            >
                                <CircularProgress />
                            </Box>
                        ) : alertRooms.length === 0 ? (
                            <Alert
                                severity="success"
                                icon={
                                    <CheckCircleIcon />
                                }
                            >
                                No active warnings
                                or critical alerts.
                            </Alert>
                        ) : (
                            <Stack spacing={2}>
                                {alertRooms.map(
                                    (room) => (
                                        <Box
                                            key={
                                                room.room_id
                                            }
                                            sx={{
                                                p: 2,
                                                borderRadius: 2,
                                                border: "1px solid",
                                                borderColor:
                                                    room.status ===
                                                        "critical"
                                                        ? "error.light"
                                                        : "warning.light",
                                                bgcolor:
                                                    room.status ===
                                                        "critical"
                                                        ? "#FFF1F0"
                                                        : "#FFF8E1",
                                            }}
                                        >
                                            <Stack
                                                direction={{
                                                    xs: "column",
                                                    md: "row",
                                                }}
                                                justifyContent="space-between"
                                                alignItems={{
                                                    xs: "flex-start",
                                                    md: "center",
                                                }}
                                                spacing={2}
                                            >
                                                <Box>
                                                    <Stack
                                                        direction="row"
                                                        alignItems="center"
                                                        spacing={1}
                                                        mb={1}
                                                    >
                                                        {getStatusIcon(
                                                            room.status
                                                        )}

                                                        <Typography fontWeight={700}>
                                                            {
                                                                room.roomName
                                                            }
                                                        </Typography>

                                                        <Chip
                                                            label={getStatusLabel(
                                                                room.status
                                                            )}
                                                            color={getStatusColor(
                                                                room.status
                                                            )}
                                                            size="small"
                                                        />
                                                    </Stack>


                                                    <Stack
                                                        direction="row"
                                                        flexWrap="wrap"
                                                        gap={1}
                                                    >
                                                        <Chip
                                                            label={`Gas: ${room.gasLevel}`}
                                                            size="small"
                                                            variant="outlined"
                                                        />

                                                        <Chip
                                                            label={`Temperature: ${room.temperature}°C`}
                                                            size="small"
                                                            variant="outlined"
                                                        />

                                                        <Chip
                                                            label={`Humidity: ${room.humidity}%`}
                                                            size="small"
                                                            variant="outlined"
                                                        />

                                                        <Chip
                                                            label={
                                                                room.motionDetected
                                                                    ? "Occupied"
                                                                    : "Vacant"
                                                            }
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </Stack>
                                                </Box>


                                                <Box
                                                    sx={{
                                                        minWidth: 120,
                                                        textAlign: {
                                                            xs: "left",
                                                            md: "right",
                                                        },
                                                    }}
                                                >
                                                    <Typography
                                                        color="text.secondary"
                                                        variant="body2"
                                                    >
                                                        Risk Score
                                                    </Typography>

                                                    <Typography
                                                        variant="h5"
                                                        fontWeight={700}
                                                    >
                                                        {
                                                            room.riskScore
                                                        }
                                                    </Typography>
                                                </Box>
                                            </Stack>


                                            <Divider
                                                sx={{
                                                    my: 2,
                                                }}
                                            />


                                            {room.prediction && (
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        mb: 1,
                                                    }}
                                                >
                                                    AI Occupancy:{" "}
                                                    <b>
                                                        {
                                                            room.prediction
                                                        }
                                                    </b>

                                                    {room.confidence !==
                                                        null &&
                                                        room.confidence !==
                                                        undefined && (
                                                            <>
                                                                {" "}
                                                                (
                                                                {
                                                                    room.confidence
                                                                }
                                                                % confidence)
                                                            </>
                                                        )}
                                                </Typography>
                                            )}


                                            {room.reasons.length >
                                                0 && (
                                                    <>
                                                        <Typography
                                                            variant="body2"
                                                            fontWeight={600}
                                                            mb={1}
                                                        >
                                                            Detection
                                                            Reason
                                                        </Typography>

                                                        {room.reasons.map(
                                                            (
                                                                reason,
                                                                index
                                                            ) => (
                                                                <Typography
                                                                    key={
                                                                        index
                                                                    }
                                                                    variant="body2"
                                                                    color="text.secondary"
                                                                    sx={{
                                                                        mb: 0.5,
                                                                    }}
                                                                >
                                                                    •{" "}
                                                                    {
                                                                        reason
                                                                    }
                                                                </Typography>
                                                            )
                                                        )}
                                                    </>
                                                )}


                                            {room.action && (
                                                <Box
                                                    sx={{
                                                        mt: 1.5,
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        bgcolor:
                                                            "rgba(255,255,255,0.7)",
                                                    }}
                                                >
                                                    <Typography
                                                        variant="body2"
                                                        fontWeight={600}
                                                    >
                                                        Suggested
                                                        Action
                                                    </Typography>

                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                        sx={{
                                                            mt: 0.5,
                                                        }}
                                                    >
                                                        {
                                                            room.action
                                                        }
                                                    </Typography>
                                                </Box>
                                            )}


                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                spacing={0.5}
                                                mt={1.5}
                                            >
                                                <AccessTimeIcon
                                                    fontSize="small"
                                                    color="disabled"
                                                />

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    {formatTimestamp(
                                                        room.timestamp
                                                    )}
                                                </Typography>
                                            </Stack>
                                        </Box>
                                    )
                                )}
                            </Stack>
                        )}
                    </CardContent>
                </Card>
            </Box>
        </Layout>
    );
}

export default Alerts;
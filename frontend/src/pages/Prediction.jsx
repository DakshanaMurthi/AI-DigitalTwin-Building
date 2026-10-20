// frontend/src/pages/Prediction.jsx

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Paper,
    Typography,
} from "@mui/material";

import Layout from "../components/Layout";

import {
    connectWebSocket,
    disconnectWebSocket,
} from "../services/websocket";

import {
    getRoomPrediction,
} from "../api/api";


/* =========================================================
   ROOM CONFIGURATION
========================================================= */

const ROOM_ORDER = [
    "RECEPTION",
    "WORKSPACE",
    "MANAGER_CABIN",
];


/* =========================================================
   HELPERS
========================================================= */

function formatRoomName(roomId) {

    if (!roomId) {
        return "Unknown Room";
    }

    return String(roomId)
        .replace(/_/g, " ")
        .replace(
            /\b\w/g,
            (char) =>
                char.toUpperCase()
        );
}


function normalizeNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


function normalizeBoolean(
    value
) {

    if (
        typeof value ===
        "boolean"
    ) {
        return value;
    }

    return (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true" ||
        value === "True"
    );
}


function normalizePrediction(
    data
) {

    const motionDetected =
        normalizeBoolean(
            data?.motion_detected
        );


    const prediction =
        data?.occupancy ??
        data?.prediction ??
        (
            motionDetected
                ? "Occupied"
                : "Vacant"
        );


    return {

        roomId:
            data?.room_id ||
            data?.roomId ||
            "",

        prediction:
            prediction || "Vacant",

        occupancySource:
            data?.occupancy_source ||
            "PIR sensor",

        motionDetected,

        mlPrediction:
            data?.ml_prediction ??
            null,

        confidence:
            data?.ml_confidence ??
            data?.confidence ??
            null,

        mlModel:
            data?.ml_model ??
            null,

        temperature:
            normalizeNumber(
                data?.temperature
            ),

        humidity:
            normalizeNumber(
                data?.humidity
            ),

        gasLevel:
            normalizeNumber(
                data?.gas_level
            ),

        status:
            data?.status ||
            "Normal",

        riskScore:
            normalizeNumber(
                data?.risk_score
            ),

        reasons:
            Array.isArray(
                data?.reasons
            )
                ? data.reasons
                : [],

        suggestedAction:
            data?.suggested_action ||
            "Room conditions are normal. Continue monitoring.",

        normalizedFeatures:
            data?.normalized_features ??
            [],

        timestamp:
            data?.timestamp ??
            null,
    };
}


/* =========================================================
   EMPTY PREDICTION
========================================================= */

function createEmptyPrediction(
    roomId
) {

    return {

        roomId,

        prediction:
            "Vacant",

        occupancySource:
            "PIR sensor",

        motionDetected:
            false,

        mlPrediction:
            null,

        confidence:
            null,

        mlModel:
            null,

        temperature:
            0,

        humidity:
            0,

        gasLevel:
            0,

        status:
            "Normal",

        riskScore:
            0,

        reasons:
            [],

        suggestedAction:
            "Waiting for sensor data.",

        normalizedFeatures:
            [],

        timestamp:
            null,
    };
}


/* =========================================================
   STATUS COLOR
========================================================= */

function getStatusColor(
    status
) {

    if (
        status ===
        "Critical"
    ) {
        return "error";
    }

    if (
        status ===
        "Warning"
    ) {
        return "warning";
    }

    return "success";
}


/* =========================================================
   PREDICTION CARD
========================================================= */

function PredictionCard({
    prediction,
}) {

    const statusColor =
        getStatusColor(
            prediction.status
        );


    const occupied =
        prediction.prediction ===
        "Occupied";


    return (

        <Paper
            elevation={2}
            sx={{
                p: 2.5,

                borderRadius: 2,

                height: "100%",

                boxSizing:
                    "border-box",

                display:
                    "flex",

                flexDirection:
                    "column",

                gap: 1.5,
            }}
        >

            {/* =====================================================
                ROOM HEADER
            ===================================================== */}

            <Box
                sx={{
                    display:
                        "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "space-between",

                    gap: 1,

                    flexWrap:
                        "wrap",
                }}
            >

                <Typography
                    variant="h6"
                    sx={{
                        fontWeight:
                            700,
                    }}
                >
                    {
                        formatRoomName(
                            prediction.roomId
                        )
                    }
                </Typography>


                <Chip
                    label={
                        prediction.status
                    }
                    color={
                        statusColor
                    }
                    size="small"
                    sx={{
                        fontWeight:
                            600,
                    }}
                />

            </Box>


            {/* =====================================================
                OCCUPANCY
            ===================================================== */}

            <Box
                sx={{
                    p: 2,

                    borderRadius: 2,

                    bgcolor:
                        occupied
                            ? "primary.50"
                            : "grey.100",

                    border:
                        "1px solid",

                    borderColor:
                        occupied
                            ? "primary.200"
                            : "divider",
                }}
            >

                <Typography
                    variant="caption"
                    sx={{
                        color:
                            "text.secondary",

                        display:
                            "block",

                        mb: 0.5,
                    }}
                >
                    Current Occupancy
                </Typography>


                <Typography
                    variant="h5"
                    sx={{
                        fontWeight:
                            800,

                        color:
                            occupied
                                ? "primary.main"
                                : "text.primary",
                    }}
                >
                    {
                        prediction.prediction
                    }
                </Typography>


                <Typography
                    variant="body2"
                    sx={{
                        color:
                            "text.secondary",

                        mt: 0.5,
                    }}
                >
                    Source:{" "}
                    {
                        prediction.occupancySource
                    }
                </Typography>

            </Box>


            {/* =====================================================
                ML PREDICTION
            ===================================================== */}

            <Box>

                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight:
                            700,

                        mb: 1,
                    }}
                >
                    ML Prediction
                </Typography>


                <Box
                    sx={{
                        display:
                            "grid",

                        gridTemplateColumns:
                            "repeat(2, minmax(0, 1fr))",

                        gap: 1,
                    }}
                >

                    <Box
                        sx={{
                            p: 1.25,

                            border:
                                "1px solid",

                            borderColor:
                                "divider",

                            borderRadius:
                                1.5,
                        }}
                    >

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            Prediction
                        </Typography>


                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight:
                                    700,

                                mt: 0.25,
                            }}
                        >
                            {
                                prediction.mlPrediction ||
                                "N/A"
                            }
                        </Typography>

                    </Box>


                    <Box
                        sx={{
                            p: 1.25,

                            border:
                                "1px solid",

                            borderColor:
                                "divider",

                            borderRadius:
                                1.5,
                        }}
                    >

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            Confidence
                        </Typography>


                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight:
                                    700,

                                mt: 0.25,
                            }}
                        >
                            {
                                prediction.confidence !==
                                    null &&
                                    prediction.confidence !==
                                    undefined
                                    ? `${Number(
                                        prediction.confidence
                                    ).toFixed(
                                        2
                                    )}%`
                                    : "N/A"
                            }
                        </Typography>

                    </Box>

                </Box>


                {prediction.mlModel && (

                    <Typography
                        variant="caption"
                        sx={{
                            color:
                                "text.secondary",

                            display:
                                "block",

                            mt: 1,
                        }}
                    >
                        Model:{" "}
                        {
                            prediction.mlModel
                        }
                    </Typography>

                )}

            </Box>


            {/* =====================================================
                SENSOR VALUES
            ===================================================== */}

            <Box>

                <Typography
                    variant="subtitle2"
                    sx={{
                        fontWeight:
                            700,

                        mb: 1,
                    }}
                >
                    Sensor Values
                </Typography>


                <Box
                    sx={{
                        display:
                            "grid",

                        gridTemplateColumns:
                            "repeat(3, minmax(0, 1fr))",

                        gap: 1,
                    }}
                >

                    <Box
                        sx={{
                            p: 1.25,

                            bgcolor:
                                "background.default",

                            borderRadius:
                                1.5,
                        }}
                    >

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            Temperature
                        </Typography>


                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight:
                                    700,
                            }}
                        >
                            {
                                prediction.temperature.toFixed(
                                    2
                                )
                            } °C
                        </Typography>

                    </Box>


                    <Box
                        sx={{
                            p: 1.25,

                            bgcolor:
                                "background.default",

                            borderRadius:
                                1.5,
                        }}
                    >

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            Humidity
                        </Typography>


                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight:
                                    700,
                            }}
                        >
                            {
                                prediction.humidity.toFixed(
                                    2
                                )
                            } %
                        </Typography>

                    </Box>


                    <Box
                        sx={{
                            p: 1.25,

                            bgcolor:
                                "background.default",

                            borderRadius:
                                1.5,
                        }}
                    >

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            Gas
                        </Typography>


                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight:
                                    700,
                            }}
                        >
                            {
                                prediction.gasLevel.toFixed(
                                    0
                                )
                            }
                        </Typography>

                    </Box>

                </Box>

            </Box>


            {/* =====================================================
                PIR
            ===================================================== */}

            <Box
                sx={{
                    display:
                        "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "space-between",

                    p: 1.25,

                    borderRadius:
                        1.5,

                    border:
                        "1px solid",

                    borderColor:
                        "divider",
                }}
            >

                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    PIR Motion
                </Typography>


                <Chip
                    label={
                        prediction.motionDetected
                            ? "Detected"
                            : "Not Detected"
                    }
                    size="small"
                    color={
                        prediction.motionDetected
                            ? "primary"
                            : "default"
                    }
                    sx={{
                        fontWeight:
                            600,
                    }}
                />

            </Box>


            {/* =====================================================
                RISK
            ===================================================== */}

            <Box>

                <Box
                    sx={{
                        display:
                            "flex",

                        alignItems:
                            "center",

                        justifyContent:
                            "space-between",

                        mb: 0.75,
                    }}
                >

                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight:
                                700,
                        }}
                    >
                        Risk Score
                    </Typography>


                    <Typography
                        variant="subtitle2"
                        sx={{
                            fontWeight:
                                800,

                            color:
                                prediction.riskScore >=
                                    50
                                    ? "error.main"
                                    : prediction.riskScore >=
                                        25
                                        ? "warning.main"
                                        : "success.main",
                        }}
                    >
                        {
                            prediction.riskScore
                        }/100
                    </Typography>

                </Box>


                <Box
                    sx={{
                        width:
                            "100%",

                        height:
                            8,

                        borderRadius:
                            10,

                        bgcolor:
                            "grey.200",

                        overflow:
                            "hidden",
                    }}
                >

                    <Box
                        sx={{
                            width:
                                `${Math.min(
                                    Math.max(
                                        prediction.riskScore,
                                        0
                                    ),
                                    100
                                )}%`,

                            height:
                                "100%",

                            bgcolor:
                                prediction.riskScore >=
                                    50
                                    ? "error.main"
                                    : prediction.riskScore >=
                                        25
                                        ? "warning.main"
                                        : "success.main",

                            transition:
                                "width 0.3s ease",
                        }}
                    />

                </Box>

            </Box>


            {/* =====================================================
                REASONS
            ===================================================== */}

            {prediction.reasons.length >
                0 && (

                    <Box>

                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight:
                                    700,

                                mb: 0.75,
                            }}
                        >
                            Detection Reasons
                        </Typography>


                        <Box
                            component="ul"
                            sx={{
                                m: 0,

                                pl: 2.5,
                            }}
                        >

                            {prediction.reasons.map(
                                (
                                    reason,
                                    index
                                ) => (

                                    <Typography
                                        component="li"
                                        variant="body2"
                                        key={
                                            index
                                        }
                                        sx={{
                                            color:
                                                "text.secondary",

                                            mb: 0.25,
                                        }}
                                    >
                                        {
                                            reason
                                        }
                                    </Typography>

                                )
                            )}

                        </Box>

                    </Box>

                )}


            {/* =====================================================
                SUGGESTED ACTION
            ===================================================== */}

            <Box
                sx={{
                    mt: "auto",

                    p: 1.5,

                    borderRadius:
                        1.5,

                    bgcolor:
                        prediction.status ===
                            "Critical"
                            ? "error.50"
                            : prediction.status ===
                                "Warning"
                                ? "warning.50"
                                : "success.50",

                    border:
                        "1px solid",

                    borderColor:
                        prediction.status ===
                            "Critical"
                            ? "error.200"
                            : prediction.status ===
                                "Warning"
                                ? "warning.200"
                                : "success.200",
                }}
            >

                <Typography
                    variant="caption"
                    sx={{
                        fontWeight:
                            700,

                        display:
                            "block",

                        mb: 0.5,
                    }}
                >
                    Suggested Action
                </Typography>


                <Typography
                    variant="body2"
                    sx={{
                        color:
                            "text.secondary",
                    }}
                >
                    {
                        prediction.suggestedAction
                    }
                </Typography>

            </Box>

        </Paper>
    );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Prediction() {

    const [
        predictions,
        setPredictions,
    ] = useState(
        () => {

            const initial = {};

            ROOM_ORDER.forEach(
                (roomId) => {

                    initial[
                        roomId
                    ] =
                        createEmptyPrediction(
                            roomId
                        );

                }
            );

            return initial;
        }
    );


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    const [
        wsConnected,
        setWsConnected,
    ] = useState(false);


    const [
        lastUpdate,
        setLastUpdate,
    ] = useState(null);


    /* =====================================================
       LOAD REST PREDICTION
    ===================================================== */

    const loadPrediction =
        useCallback(
            async (
                roomId
            ) => {

                try {

                    const data =
                        await getRoomPrediction(
                            roomId
                        );


                    const normalized =
                        normalizePrediction(
                            data
                        );


                    setPredictions(
                        (
                            previous
                        ) => ({
                            ...previous,

                            [roomId]:
                                normalized,
                        })
                    );


                    if (
                        normalized.timestamp
                    ) {

                        setLastUpdate(
                            normalized.timestamp
                        );
                    }


                    return normalized;

                } catch (
                requestError
                ) {

                    console.error(
                        `[AI Prediction] Failed to load ${roomId}:`,
                        requestError
                    );


                    return null;
                }

            },
            []
        );


    /* =====================================================
       LOAD ALL PREDICTIONS
    ===================================================== */

    const loadAllPredictions =
        useCallback(
            async () => {

                setError("");


                const results =
                    await Promise.all(
                        ROOM_ORDER.map(
                            (
                                roomId
                            ) =>
                                loadPrediction(
                                    roomId
                                )
                        )
                    );


                const validResults =
                    results.filter(
                        Boolean
                    );


                if (
                    validResults.length ===
                    0
                ) {

                    setError(
                        "Unable to load AI prediction data. Waiting for live sensor updates..."
                    );

                } else {

                    setError("");

                }


                setLoading(
                    false
                );

            },
            [
                loadPrediction,
            ]
        );


    /* =====================================================
       WEBSOCKET
    ===================================================== */

    const handleWebSocketMessage =
        useCallback(
            (message) => {

                /*
                 * Backend sends this immediately
                 * after the shared WebSocket connects.
                 */

                if (
                    message?.type ===
                    "connection"
                ) {

                    setWsConnected(
                        true
                    );


                    console.log(
                        "[AI Prediction] Shared WebSocket connection established"
                    );


                    return;
                }


                /*
                 * Prediction page only needs
                 * sensor_update messages.
                 */

                if (
                    message?.type !==
                    "sensor_update"
                ) {

                    return;
                }


                const roomId =
                    message?.room_id;


                if (!roomId) {
                    return;
                }


                const normalized =
                    normalizePrediction(
                        message
                    );


                console.log(
                    `[AI Prediction WS] ${roomId} | ` +
                    `Occupancy=${normalized.prediction ?? "N/A"} | ` +
                    `ML=${normalized.mlPrediction ?? "N/A"} | ` +
                    `Confidence=${normalized.confidence ?? "N/A"}% | ` +
                    `Risk=${normalized.riskScore ?? "N/A"}/100 | ` +
                    `Status=${normalized.status}`
                );


                setPredictions(
                    (
                        previous
                    ) => ({
                        ...previous,

                        [roomId]:
                            normalized,
                    })
                );


                setLastUpdate(
                    normalized.timestamp ||
                    new Date().toISOString()
                );


                setWsConnected(
                    true
                );

            },
            []
        );


    /* =====================================================
       INITIALIZE
    ===================================================== */

    useEffect(() => {

        /*
         * Initial REST data.
         */

        loadAllPredictions();


        /*
         * Subscribe to shared WebSocket.
         */

        connectWebSocket(
            handleWebSocketMessage
        );


        /*
         * REST fallback refresh.
         *
         * This does not replace WebSocket.
         * It simply keeps the page populated if
         * a live message is missed.
         */

        const refreshTimer =
            setInterval(
                () => {

                    loadAllPredictions();

                },
                10000
            );


        return () => {

            /*
             * IMPORTANT:
             *
             * Remove the exact same callback
             * that was registered above.
             */

            setWsConnected(
                false
            );


            disconnectWebSocket(
                handleWebSocketMessage
            );


            clearInterval(
                refreshTimer
            );

        };

    }, [
        handleWebSocketMessage,
        loadAllPredictions,
    ]);


    /* =====================================================
       SUMMARY
    ===================================================== */

    const summary =
        useMemo(
            () => {

                const values =
                    ROOM_ORDER.map(
                        (
                            roomId
                        ) =>
                            predictions[
                            roomId
                            ]
                    );


                const occupied =
                    values.filter(
                        (
                            item
                        ) =>
                            item?.prediction ===
                            "Occupied"
                    ).length;


                const vacant =
                    values.filter(
                        (
                            item
                        ) =>
                            item?.prediction ===
                            "Vacant"
                    ).length;


                const critical =
                    values.filter(
                        (
                            item
                        ) =>
                            item?.status ===
                            "Critical"
                    ).length;


                const warning =
                    values.filter(
                        (
                            item
                        ) =>
                            item?.status ===
                            "Warning"
                    ).length;


                const normal =
                    values.filter(
                        (
                            item
                        ) =>
                            item?.status ===
                            "Normal"
                    ).length;


                return {
                    total:
                        values.length,

                    occupied,

                    vacant,

                    critical,

                    warning,

                    normal,
                };

            },
            [
                predictions,
            ]
        );


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <Layout>

            <Box
                sx={{
                    width:
                        "100%",

                    minWidth:
                        0,

                    bgcolor:
                        "#f4f7fb",

                    minHeight:
                        "100%",
                }}
            >

                <Box
                    sx={{
                        width:
                            "100%",

                        maxWidth:
                            "1280px",

                        mx:
                            "auto",

                        px: {
                            xs: 2,
                            sm: 3,
                            md: 4,
                        },

                        pt: {
                            xs: 2.5,
                            md: 3,
                        },

                        pb: 5,

                        boxSizing:
                            "border-box",
                    }}
                >

                    {/* =================================================
                        HEADER
                    ================================================= */}

                    <Box
                        sx={{
                            mb: 2.5,
                        }}
                    >

                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight:
                                    800,

                                fontSize: {
                                    xs:
                                        "1.8rem",

                                    sm:
                                        "2.1rem",

                                    md:
                                        "2.35rem",
                                },

                                lineHeight:
                                    1.15,
                            }}
                        >
                            AI Predictions
                        </Typography>


                        <Typography
                            variant="body1"
                            sx={{
                                color:
                                    "text.secondary",

                                mt: 0.75,
                            }}
                        >
                            AI-based occupancy,
                            sensor analysis,
                            risk assessment and
                            recommended actions
                        </Typography>


                        <Box
                            sx={{
                                display:
                                    "flex",

                                alignItems:
                                    "center",

                                gap: 1,

                                flexWrap:
                                    "wrap",

                                mt: 1.25,
                            }}
                        >

                            <Chip
                                label={
                                    wsConnected
                                        ? "WebSocket: Live"
                                        : "WebSocket: Disconnected"
                                }
                                color={
                                    wsConnected
                                        ? "success"
                                        : "default"
                                }
                                size="small"
                                sx={{
                                    fontWeight:
                                        600,
                                }}
                            />


                            <Chip
                                label={`${summary.total} rooms`}
                                size="small"
                                variant="outlined"
                            />


                            {lastUpdate && (

                                <Chip
                                    label={`Last update: ${new Date(
                                        lastUpdate
                                    ).toLocaleTimeString()}`}
                                    size="small"
                                    variant="outlined"
                                />

                            )}

                        </Box>

                    </Box>


                    {/* =================================================
                        ERROR
                    ================================================= */}

                    {error && (

                        <Alert
                            severity="info"
                            sx={{
                                mb: 2,
                            }}
                        >
                            {error}
                        </Alert>

                    )}


                    {/* =================================================
                        SUMMARY
                    ================================================= */}

                    <Box
                        sx={{
                            display:
                                "grid",

                            gridTemplateColumns:
                            {
                                xs:
                                    "1fr",

                                sm:
                                    "repeat(2, minmax(0, 1fr))",

                                md:
                                    "repeat(6, minmax(0, 1fr))",
                            },

                            gap: 2,

                            mb: 3,
                        }}
                    >

                        <Paper
                            elevation={2}
                            sx={{
                                p: 2,

                                borderRadius:
                                    2,
                            }}
                        >

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Total Rooms
                            </Typography>


                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight:
                                        800,

                                    mt: 0.5,
                                }}
                            >
                                {
                                    summary.total
                                }
                            </Typography>

                        </Paper>


                        <Paper
                            elevation={2}
                            sx={{
                                p: 2,

                                borderRadius:
                                    2,
                            }}
                        >

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Occupied
                            </Typography>


                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight:
                                        800,

                                    mt: 0.5,

                                    color:
                                        "primary.main",
                                }}
                            >
                                {
                                    summary.occupied
                                }
                            </Typography>

                        </Paper>


                        <Paper
                            elevation={2}
                            sx={{
                                p: 2,

                                borderRadius:
                                    2,
                            }}
                        >

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Vacant
                            </Typography>


                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight:
                                        800,

                                    mt: 0.5,
                                }}
                            >
                                {
                                    summary.vacant
                                }
                            </Typography>

                        </Paper>


                        <Paper
                            elevation={2}
                            sx={{
                                p: 2,

                                borderRadius:
                                    2,
                            }}
                        >

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Normal
                            </Typography>


                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight:
                                        800,

                                    mt: 0.5,

                                    color:
                                        "success.main",
                                }}
                            >
                                {
                                    summary.normal
                                }
                            </Typography>

                        </Paper>


                        <Paper
                            elevation={2}
                            sx={{
                                p: 2,

                                borderRadius:
                                    2,
                            }}
                        >

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Warning
                            </Typography>


                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight:
                                        800,

                                    mt: 0.5,

                                    color:
                                        "warning.main",
                                }}
                            >
                                {
                                    summary.warning
                                }
                            </Typography>

                        </Paper>


                        <Paper
                            elevation={2}
                            sx={{
                                p: 2,

                                borderRadius:
                                    2,
                            }}
                        >

                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                Critical
                            </Typography>


                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight:
                                        800,

                                    mt: 0.5,

                                    color:
                                        "error.main",
                                }}
                            >
                                {
                                    summary.critical
                                }
                            </Typography>

                        </Paper>

                    </Box>


                    {/* =================================================
                        ROOM PREDICTIONS
                    ================================================= */}

                    <Box
                        sx={{
                            mb: 3,
                        }}
                    >

                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight:
                                    700,

                                mb: 1.5,
                            }}
                        >
                            Room AI Predictions
                        </Typography>


                        <Box
                            sx={{
                                display:
                                    "grid",

                                gridTemplateColumns:
                                {
                                    xs:
                                        "1fr",

                                    md:
                                        "repeat(2, minmax(0, 1fr))",

                                    lg:
                                        "repeat(3, minmax(0, 1fr))",
                                },

                                gap: 2,
                            }}
                        >

                            {ROOM_ORDER.map(
                                (
                                    roomId
                                ) => (

                                    <PredictionCard
                                        key={
                                            roomId
                                        }
                                        prediction={
                                            predictions[
                                            roomId
                                            ] ||
                                            createEmptyPrediction(
                                                roomId
                                            )
                                        }
                                    />

                                )
                            )}

                        </Box>

                    </Box>


                    {/* =================================================
                        AI EXPLANATION
                    ================================================= */}

                    <Paper
                        elevation={2}
                        sx={{
                            p: 2.5,

                            borderRadius:
                                2,

                            mb: 3,
                        }}
                    >

                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight:
                                    700,

                                mb: 1,
                            }}
                        >
                            Prediction Method
                        </Typography>


                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                lineHeight:
                                    1.7,
                            }}
                        >
                            Operational occupancy is
                            determined from the PIR
                            sensor. The machine-learning
                            model provides an additional
                            occupancy prediction and
                            confidence value for comparison.
                            Environmental conditions are
                            evaluated using temperature,
                            humidity and gas-sensor
                            thresholds to generate room
                            status and risk information.
                        </Typography>

                    </Paper>


                    {/* =================================================
                        LOADING
                    ================================================= */}

                    {loading && (

                        <Box
                            sx={{
                                display:
                                    "flex",

                                justifyContent:
                                    "center",

                                py: 4,
                            }}
                        >

                            <CircularProgress />

                        </Box>

                    )}

                </Box>

            </Box>

        </Layout>
    );
}
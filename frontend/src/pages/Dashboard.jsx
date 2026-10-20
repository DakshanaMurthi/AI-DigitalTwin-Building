// frontend/src/pages/Dashboard.jsx

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
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

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

import Layout from "../components/Layout";

import {
    connectWebSocket,
    disconnectWebSocket,
} from "../services/websocket";


/* =========================================================
   CONFIGURATION
========================================================= */

const API_HOST =
    import.meta.env.VITE_API_URL ||
    `http://${window.location.hostname}:8000`;

const API_BASE_URL =
    API_HOST.replace(/\/$/, "");

const MAX_CHART_POINTS = 30;


/* =========================================================
   ROOM ORDER
========================================================= */

const ROOM_ORDER = [
    "RECEPTION",
    "WORKSPACE",
    "MANAGER_CABIN",
];


/* =========================================================
   HELPERS
========================================================= */

function normalizeNumber(
    value,
    fallback = 0
) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}


function normalizeBoolean(value) {

    if (typeof value === "boolean") {
        return value;
    }

    if (
        value === 1 ||
        value === "1" ||
        value === "true" ||
        value === "True" ||
        value === "occupied" ||
        value === "Occupied"
    ) {
        return true;
    }

    return false;
}


function formatRoomName(roomId) {

    if (!roomId) {
        return "Unknown Room";
    }

    return String(roomId)
        .replace(/_/g, " ")
        .replace(
            /\b\w/g,
            (char) => char.toUpperCase()
        );
}


function formatTime(timestamp) {

    if (!timestamp) {
        return "--:--:--";
    }

    const date =
        new Date(timestamp);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "--:--:--";
    }

    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }
    );
}


function normalizeStatus(status) {

    if (!status) {
        return "Normal";
    }

    const value =
        String(status).toLowerCase();

    if (value === "critical") {
        return "Critical";
    }

    if (value === "warning") {
        return "Warning";
    }

    return "Normal";
}


function normalizeOccupancy(
    value,
    motionDetected
) {

    if (value) {

        const normalized =
            String(value).toLowerCase();

        if (
            normalized ===
            "occupied"
        ) {
            return "Occupied";
        }

        if (
            normalized ===
            "vacant"
        ) {
            return "Vacant";
        }
    }

    return motionDetected
        ? "Occupied"
        : "Vacant";
}


/* =========================================================
   EMPTY ROOM OBJECT
========================================================= */

function createEmptyRoom(
    roomId
) {

    return {
        room_id: roomId,

        temperature: 0,
        humidity: 0,
        gas_level: 0,

        motion_detected: false,

        occupancy: "Vacant",
        occupancy_source:
            "PIR sensor",

        ml_prediction: null,
        ml_confidence: null,
        ml_model: null,

        status: "Normal",
        risk_score: 0,

        reasons: [],

        suggested_action:
            "Room conditions are normal. Continue monitoring.",

        normalized_features: [],

        timestamp: null,

        temperature_history: [],
        humidity_history: [],
        gas_history: [],
    };
}


/* =========================================================
   NORMALIZE API / WEBSOCKET ROOM
========================================================= */

function normalizeRoom(
    data,
    previous = null
) {

    const roomId =
        data?.room_id ||
        data?.roomId ||
        previous?.room_id ||
        "UNKNOWN";


    const temperature =
        normalizeNumber(
            data?.temperature,
            previous?.temperature ?? 0
        );


    const humidity =
        normalizeNumber(
            data?.humidity,
            previous?.humidity ?? 0
        );


    const gasLevel =
        normalizeNumber(
            data?.gas_level,
            previous?.gas_level ?? 0
        );


    const motionDetected =
        normalizeBoolean(
            data?.motion_detected ??
            data?.motionDetected ??
            previous?.motion_detected
        );


    const occupancy =
        normalizeOccupancy(
            data?.occupancy ??
            data?.prediction ??
            previous?.occupancy,
            motionDetected
        );


    const status =
        normalizeStatus(
            data?.status ??
            previous?.status
        );


    const riskScore =
        normalizeNumber(
            data?.risk_score ??
            previous?.risk_score,
            0
        );


    const reasons =
        Array.isArray(
            data?.reasons
        )
            ? data.reasons
            : previous?.reasons || [];


    const timestamp =
        data?.timestamp ??
        previous?.timestamp ??
        null;


    return {
        ...createEmptyRoom(roomId),

        ...(previous || {}),

        room_id: roomId,

        temperature,
        humidity,
        gas_level: gasLevel,

        motion_detected:
            motionDetected,

        occupancy,

        occupancy_source:
            data?.occupancy_source ??
            previous?.occupancy_source ??
            "PIR sensor",

        ml_prediction:
            data?.ml_prediction ??
            previous?.ml_prediction ??
            null,

        ml_confidence:
            data?.ml_confidence ??
            data?.confidence ??
            previous?.ml_confidence ??
            null,

        ml_model:
            data?.ml_model ??
            previous?.ml_model ??
            null,

        status,

        risk_score:
            riskScore,

        reasons,

        suggested_action:
            data?.suggested_action ??
            previous?.suggested_action ??
            "Room conditions are normal. Continue monitoring.",

        normalized_features:
            data?.normalized_features ??
            previous?.normalized_features ??
            [],

        timestamp,

        temperature_history:
            previous?.temperature_history ||
            [],

        humidity_history:
            previous?.humidity_history ||
            [],

        gas_history:
            previous?.gas_history ||
            [],
    };
}


/* =========================================================
   HISTORY UPDATE
========================================================= */

function appendHistory(
    previousHistory,
    timestamp,
    value
) {

    const next = [
        ...(previousHistory || []),

        {
            timestamp,

            time:
                formatTime(
                    timestamp
                ),

            value:
                normalizeNumber(
                    value
                ),
        },
    ];

    return next.slice(
        -MAX_CHART_POINTS
    );
}


/* =========================================================
   DASHBOARD CARD
========================================================= */

function SummaryCard({
    title,
    value,
    subtitle,
    chipLabel,
    chipColor = "primary",
}) {

    return (
        <Paper
            elevation={2}
            sx={{
                height: "100%",
                minHeight: 142,

                p: 2,

                borderRadius: 2,

                borderTop: "4px solid",

                borderColor:
                    chipColor === "error"
                        ? "error.main"
                        : chipColor === "warning"
                            ? "warning.main"
                            : chipColor === "success"
                                ? "success.main"
                                : "primary.main",

                display: "flex",

                flexDirection:
                    "column",

                justifyContent:
                    "space-between",

                boxSizing:
                    "border-box",
            }}
        >

            <Typography
                variant="body2"
                sx={{
                    color:
                        "text.secondary",

                    fontWeight: 500,
                }}
            >
                {title}
            </Typography>


            <Typography
                sx={{
                    fontSize: {
                        xs: "1.65rem",
                        sm: "1.85rem",
                    },

                    fontWeight: 700,

                    color:
                        "text.primary",

                    lineHeight: 1.15,

                    my: 1,
                }}
            >
                {value}
            </Typography>


            <Box
                sx={{
                    display: "flex",

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
                    variant="caption"
                    sx={{
                        color:
                            "text.secondary",
                    }}
                >
                    {subtitle}
                </Typography>


                {chipLabel && (

                    <Chip
                        label={
                            chipLabel
                        }
                        size="small"
                        color={
                            chipColor
                        }
                        sx={{
                            fontWeight: 600,
                            height: 24,
                        }}
                    />

                )}

            </Box>

        </Paper>
    );
}


/* =========================================================
   ROOM MONITORING CARD
========================================================= */

function RoomMonitoringCard({
    room,
}) {

    const occupied =
        room.occupancy ===
        "Occupied";


    const statusColor =
        room.status ===
            "Critical"
            ? "error"
            : room.status ===
                "Warning"
                ? "warning"
                : "success";


    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,

                minHeight: 130,

                height: "100%",

                borderRadius: 2,

                boxSizing:
                    "border-box",

                display: "flex",

                flexDirection:
                    "column",

                justifyContent:
                    "space-between",

                transition:
                    "transform 0.2s ease, box-shadow 0.2s ease",

                "&:hover": {
                    transform:
                        "translateY(-2px)",

                    boxShadow: 4,
                },
            }}
        >

            <Box
                sx={{
                    display: "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "space-between",

                    gap: 1,
                }}
            >

                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        fontSize:
                            "1rem",
                    }}
                >
                    {formatRoomName(
                        room.room_id
                    )}
                </Typography>


                <Chip
                    label={
                        occupied
                            ? "Occupied"
                            : "Vacant"
                    }
                    size="small"
                    color={
                        occupied
                            ? "primary"
                            : "default"
                    }
                    sx={{
                        fontWeight: 600,
                    }}
                />

            </Box>


            <Typography
                variant="body2"
                sx={{
                    color:
                        "text.secondary",

                    mt: 1,
                }}
            >
                Current occupancy
            </Typography>


            <Box
                sx={{
                    display: "flex",

                    alignItems:
                        "center",

                    justifyContent:
                        "space-between",

                    mt: 1,
                }}
            >

                <Typography
                    variant="body2"
                    sx={{
                        color:
                            "text.secondary",
                    }}
                >
                    Room status
                </Typography>


                <Chip
                    label={
                        room.status
                    }
                    size="small"
                    color={
                        statusColor
                    }
                    sx={{
                        fontWeight: 600,
                    }}
                />

            </Box>

        </Paper>
    );
}


/* =========================================================
   LIVE CHART
========================================================= */

function LiveChart({
    title,
    data,
    unit,
    lineColor,
}) {

    const safeData =
        Array.isArray(data)
            ? data.filter(
                (item) =>
                    Number.isFinite(
                        Number(
                            item?.value
                        )
                    )
            )
            : [];


    const values =
        safeData.map(
            (item) =>
                Number(item.value)
        );


    const minValue =
        values.length > 0
            ? Math.min(...values)
            : 0;


    const maxValue =
        values.length > 0
            ? Math.max(...values)
            : 1;


    let domainMin;
    let domainMax;


    if (
        values.length === 0
    ) {

        domainMin = 0;
        domainMax = 1;

    } else if (
        minValue ===
        maxValue
    ) {

        const padding =
            Math.abs(
                minValue
            ) * 0.05 || 1;

        domainMin =
            minValue -
            padding;

        domainMax =
            maxValue +
            padding;

    } else {

        const range =
            maxValue -
            minValue;

        const padding =
            Math.max(
                range * 0.15,
                0.1
            );

        domainMin =
            minValue -
            padding;

        domainMax =
            maxValue +
            padding;
    }


    return (
        <Paper
            elevation={2}
            sx={{
                width: "100%",

                minWidth: 0,

                height: 310,

                p: 1.75,

                borderRadius: 2,

                boxSizing:
                    "border-box",

                display: "flex",

                flexDirection:
                    "column",
            }}
        >

            <Typography
                variant="subtitle1"
                sx={{
                    fontWeight: 700,
                    mb: 1,
                }}
            >
                {title}
            </Typography>


            <Box
                sx={{
                    flex: 1,

                    width: "100%",

                    minWidth: 0,

                    minHeight: 0,
                }}
            >

                {safeData.length ===
                    0 ? (

                    <Box
                        sx={{
                            height: "100%",

                            display:
                                "flex",

                            alignItems:
                                "center",

                            justifyContent:
                                "center",

                            border:
                                "1px dashed",

                            borderColor:
                                "divider",

                            borderRadius:
                                1.5,

                            color:
                                "text.secondary",
                        }}
                    >

                        <Typography
                            variant="body2"
                        >
                            Waiting for live sensor data...
                        </Typography>

                    </Box>

                ) : (

                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >

                        <LineChart
                            data={
                                safeData
                            }
                            margin={{
                                top: 8,
                                right: 12,
                                left: 0,
                                bottom: 4,
                            }}
                        >

                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={
                                    false
                                }
                            />


                            <XAxis
                                dataKey="time"
                                tick={{
                                    fontSize: 10,
                                }}
                                tickMargin={6}
                                minTickGap={24}
                            />


                            <YAxis
                                domain={[
                                    domainMin,
                                    domainMax,
                                ]}
                                tick={{
                                    fontSize: 10,
                                }}
                                width={48}
                                tickFormatter={
                                    (
                                        value
                                    ) =>
                                        Number(
                                            value
                                        ).toFixed(
                                            unit ===
                                                "°C"
                                                ? 1
                                                : unit ===
                                                    "%"
                                                    ? 1
                                                    : 0
                                        )
                                }
                            />


                            <Tooltip
                                formatter={
                                    (
                                        value
                                    ) => [
                                            `${Number(
                                                value
                                            ).toFixed(
                                                unit ===
                                                    "°C"
                                                    ? 2
                                                    : unit ===
                                                        "%"
                                                        ? 2
                                                        : 0
                                            )} ${unit}`,

                                            title,
                                        ]
                                }

                                labelFormatter={
                                    (
                                        label
                                    ) =>
                                        `Time: ${label}`
                                }
                            />


                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={
                                    lineColor
                                }
                                strokeWidth={
                                    2.5
                                }
                                dot={
                                    false
                                }
                                activeDot={{
                                    r: 4,
                                }}
                                isAnimationActive={
                                    false
                                }
                                connectNulls
                            />

                        </LineChart>

                    </ResponsiveContainer>

                )}

            </Box>

        </Paper>
    );
}


/* =========================================================
   LIVE ALERTS
========================================================= */

function LiveAlerts({
    rooms,
}) {

    const alerts =
        useMemo(() => {

            const result =
                [];

            rooms.forEach(
                (room) => {

                    if (
                        room.status !==
                        "Warning" &&
                        room.status !==
                        "Critical"
                    ) {
                        return;
                    }


                    const reasons =
                        Array.isArray(
                            room.reasons
                        ) &&
                            room.reasons.length >
                            0
                            ? room.reasons
                            : [
                                "Room condition requires attention.",
                            ];


                    result.push({
                        roomId:
                            room.room_id,

                        status:
                            room.status,

                        riskScore:
                            room.risk_score,

                        reasons,

                        timestamp:
                            room.timestamp,
                    });

                }
            );


            return result;

        }, [rooms]);


    return (
        <Paper
            elevation={2}
            sx={{
                width: "100%",

                borderRadius: 2,

                p: 2.5,

                boxSizing:
                    "border-box",
            }}
        >

            <Box
                sx={{
                    display: "flex",

                    alignItems:
                        "center",

                    gap: 1,

                    mb: 2,
                }}
            >

                <Typography
                    sx={{
                        fontSize:
                            "1.35rem",
                    }}
                >
                    🚨
                </Typography>


                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                    }}
                >
                    Live Alerts
                </Typography>

            </Box>


            {alerts.length ===
                0 ? (

                <Box
                    sx={{
                        display:
                            "flex",

                        alignItems:
                            "center",

                        gap: 1,

                        p: 1.5,

                        borderRadius:
                            1.5,

                        bgcolor:
                            "success.50",

                        border:
                            "1px solid",

                        borderColor:
                            "success.200",
                    }}
                >

                    <Typography
                        sx={{
                            fontSize:
                                "1.1rem",
                        }}
                    >
                        ✓
                    </Typography>


                    <Typography
                        variant="body2"
                        sx={{
                            color:
                                "success.dark",

                            fontWeight:
                                600,
                        }}
                    >
                        No Active Alerts
                    </Typography>

                </Box>

            ) : (

                <Box
                    sx={{
                        display:
                            "flex",

                        flexDirection:
                            "column",

                        gap: 1.25,
                    }}
                >

                    {alerts.map(
                        (
                            alert,
                            index
                        ) => {

                            const critical =
                                alert.status ===
                                "Critical";


                            return (
                                <Alert
                                    key={`${alert.roomId}-${index}`}
                                    severity={
                                        critical
                                            ? "error"
                                            : "warning"
                                    }
                                    sx={{
                                        alignItems:
                                            "flex-start",
                                    }}
                                >

                                    <Box>

                                        <Typography
                                            variant="subtitle2"
                                            sx={{
                                                fontWeight:
                                                    700,
                                            }}
                                        >
                                            {
                                                formatRoomName(
                                                    alert.roomId
                                                )
                                            }{" "}
                                            —{" "}
                                            {
                                                alert.status
                                            }
                                        </Typography>


                                        <Typography
                                            variant="body2"
                                        >
                                            {
                                                alert.reasons.join(
                                                    " • "
                                                )
                                            }
                                        </Typography>


                                        <Typography
                                            variant="caption"
                                            sx={{
                                                display:
                                                    "block",

                                                mt: 0.5,

                                                opacity:
                                                    0.8,
                                            }}
                                        >
                                            Risk score:{" "}
                                            {
                                                alert.riskScore
                                            }
                                        </Typography>

                                    </Box>

                                </Alert>
                            );
                        }
                    )}

                </Box>

            )}

        </Paper>
    );
}


/* =========================================================
   AI INSIGHTS
========================================================= */

function AIInsights({
    rooms,
}) {

    const insights =
        useMemo(() => {

            const result =
                [];

            rooms.forEach(
                (room) => {

                    const operationalOccupancy =
                        room.occupancy;

                    const mlOccupancy =
                        room.ml_prediction;

                    const mismatch =
                        mlOccupancy &&
                        operationalOccupancy &&
                        mlOccupancy !==
                        operationalOccupancy;


                    if (mismatch) {

                        result.push({
                            roomId:
                                room.room_id,

                            type:
                                "Model comparison",

                            text:
                                `ML model predicts ${mlOccupancy}, ` +
                                `while operational occupancy is ` +
                                `${operationalOccupancy} based on the PIR sensor.`,
                        });

                        return;
                    }


                    if (
                        room.status ===
                        "Critical"
                    ) {

                        result.push({
                            roomId:
                                room.room_id,

                            type:
                                "Safety",

                            text:
                                room.suggested_action ||
                                "Critical room condition detected. Immediate inspection is recommended.",
                        });

                        return;
                    }


                    if (
                        room.status ===
                        "Warning"
                    ) {

                        result.push({
                            roomId:
                                room.room_id,

                            type:
                                "Attention",

                            text:
                                room.suggested_action ||
                                "Room conditions require attention.",
                        });

                        return;
                    }


                    result.push({
                        roomId:
                            room.room_id,

                        type:
                            "Normal",

                        text:
                            "Room conditions are normal. Continue monitoring.",
                    });

                }
            );


            return result;

        }, [rooms]);


    return (
        <Paper
            elevation={2}
            sx={{
                width: "100%",

                borderRadius: 2,

                p: 2.5,

                boxSizing:
                    "border-box",
            }}
        >

            <Box
                sx={{
                    display: "flex",

                    alignItems:
                        "center",

                    gap: 1,

                    mb: 2,
                }}
            >

                <Typography
                    sx={{
                        fontSize:
                            "1.25rem",
                    }}
                >
                    📡
                </Typography>


                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                    }}
                >
                    AI Insights
                </Typography>

            </Box>


            {insights.length ===
                0 ? (

                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    Waiting for AI analysis...
                </Typography>

            ) : (

                <Box
                    sx={{
                        display:
                            "flex",

                        flexDirection:
                            "column",

                        gap: 1,
                    }}
                >

                    {insights.map(
                        (
                            insight,
                            index
                        ) => (

                            <Box
                                key={`${insight.roomId}-${index}`}
                                sx={{
                                    border:
                                        "1px solid",

                                    borderColor:
                                        "divider",

                                    borderRadius:
                                        1.5,

                                    p: 1.5,

                                    transition:
                                        "background-color 0.2s ease",

                                    "&:hover": {
                                        bgcolor:
                                            "action.hover",
                                    },
                                }}
                            >

                                <Box
                                    sx={{
                                        display:
                                            "flex",

                                        alignItems:
                                            "center",

                                        justifyContent:
                                            "space-between",

                                        gap: 1,

                                        mb: 0.5,

                                        flexWrap:
                                            "wrap",
                                    }}
                                >

                                    <Typography
                                        variant="subtitle2"
                                        sx={{
                                            fontWeight:
                                                700,
                                        }}
                                    >
                                        {
                                            formatRoomName(
                                                insight.roomId
                                            )
                                        }
                                    </Typography>


                                    <Chip
                                        label={
                                            insight.type
                                        }
                                        size="small"
                                        variant="outlined"
                                        color={
                                            insight.type ===
                                                "Model comparison"
                                                ? "primary"
                                                : insight.type ===
                                                    "Safety"
                                                    ? "error"
                                                    : insight.type ===
                                                        "Attention"
                                                        ? "warning"
                                                        : "success"
                                        }
                                        sx={{
                                            height:
                                                22,

                                            fontSize:
                                                "0.7rem",
                                        }}
                                    />

                                </Box>


                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {
                                        insight.text
                                    }
                                </Typography>

                            </Box>

                        )
                    )}

                </Box>

            )}

        </Paper>
    );
}


/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function Dashboard() {

    const [
        rooms,
        setRooms,
    ] = useState(
        () =>
            ROOM_ORDER.map(
                (roomId) =>
                    createEmptyRoom(
                        roomId
                    )
            )
    );


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        apiError,
        setApiError,
    ] = useState("");


    const [
        connectionStatus,
        setConnectionStatus,
    ] = useState(
        "Disconnected"
    );


    const [
        lastUpdate,
        setLastUpdate,
    ] = useState(null);


    const mountedRef =
        useRef(false);


    const roomsRef =
        useRef(rooms);


    /* =====================================================
       KEEP ROOM REF UPDATED
    ===================================================== */

    useEffect(() => {

        roomsRef.current =
            rooms;

    }, [rooms]);


    /* =====================================================
       APPLY SENSOR UPDATE
    ===================================================== */

    const applySensorUpdate =
        useCallback(
            (message) => {

                if (
                    !message ||
                    message.type !==
                    "sensor_update"
                ) {
                    return;
                }


                const roomId =
                    message.room_id;


                if (!roomId) {
                    return;
                }


                const currentRooms =
                    roomsRef.current ||
                    [];


                const existingRoom =
                    currentRooms.find(
                        (room) =>
                            room.room_id ===
                            roomId
                    ) ||
                    createEmptyRoom(
                        roomId
                    );


                const normalizedRoom =
                    normalizeRoom(
                        message,
                        existingRoom
                    );


                const timestamp =
                    normalizedRoom.timestamp ||
                    new Date().toISOString();


                normalizedRoom.temperature_history =
                    appendHistory(
                        existingRoom.temperature_history,
                        timestamp,
                        normalizedRoom.temperature
                    );


                normalizedRoom.humidity_history =
                    appendHistory(
                        existingRoom.humidity_history,
                        timestamp,
                        normalizedRoom.humidity
                    );


                normalizedRoom.gas_history =
                    appendHistory(
                        existingRoom.gas_history,
                        timestamp,
                        normalizedRoom.gas_level
                    );


                const existingIndex =
                    currentRooms.findIndex(
                        (room) =>
                            room.room_id ===
                            roomId
                    );


                let updatedRooms;


                if (
                    existingIndex ===
                    -1
                ) {

                    updatedRooms = [
                        ...currentRooms,
                        normalizedRoom,
                    ];

                } else {

                    updatedRooms = [
                        ...currentRooms,
                    ];


                    updatedRooms[
                        existingIndex
                    ] =
                        normalizedRoom;
                }


                updatedRooms.sort(
                    (a, b) => {

                        const aIndex =
                            ROOM_ORDER.indexOf(
                                a.room_id
                            );


                        const bIndex =
                            ROOM_ORDER.indexOf(
                                b.room_id
                            );


                        return (
                            (
                                aIndex ===
                                    -1
                                    ? 999
                                    : aIndex
                            ) -
                            (
                                bIndex ===
                                    -1
                                    ? 999
                                    : bIndex
                            )
                        );
                    }
                );


                roomsRef.current =
                    updatedRooms;


                if (
                    mountedRef.current
                ) {

                    setRooms(
                        updatedRooms
                    );

                    setLastUpdate(
                        timestamp
                    );
                }

            },
            []
        );


    /* =====================================================
       INITIAL API DATA
    ===================================================== */

    const fetchInitialData =
        useCallback(
            async () => {

                try {

                    setApiError("");


                    const response =
                        await fetch(
                            `${API_BASE_URL}/rooms/dashboard`
                        );


                    if (
                        !response.ok
                    ) {

                        throw new Error(
                            `Dashboard API returned ${response.status}`
                        );
                    }


                    const payload =
                        await response.json();


                    /*
                     * Support common backend
                     * response structures:
                     *
                     * 1. [...]
                     * 2. { data: [...] }
                     * 3. { rooms: [...] }
                     */

                    let apiRooms =
                        [];


                    if (
                        Array.isArray(
                            payload
                        )
                    ) {

                        apiRooms =
                            payload;

                    } else if (
                        Array.isArray(
                            payload?.data
                        )
                    ) {

                        apiRooms =
                            payload.data;

                    } else if (
                        Array.isArray(
                            payload?.rooms
                        )
                    ) {

                        apiRooms =
                            payload.rooms;
                    }


                    const baseRooms =
                        ROOM_ORDER.map(
                            (roomId) =>
                                createEmptyRoom(
                                    roomId
                                )
                        );


                    apiRooms.forEach(
                        (apiRoom) => {

                            const roomId =
                                apiRoom?.room_id ||
                                apiRoom?.roomId;


                            if (!roomId) {
                                return;
                            }


                            const index =
                                baseRooms.findIndex(
                                    (room) =>
                                        room.room_id ===
                                        roomId
                                );


                            if (
                                index !==
                                -1
                            ) {

                                baseRooms[
                                    index
                                ] =
                                    normalizeRoom(
                                        apiRoom,
                                        baseRooms[
                                        index
                                        ]
                                    );

                            } else {

                                baseRooms.push(
                                    normalizeRoom(
                                        apiRoom
                                    )
                                );
                            }

                        }
                    );


                    /*
                     * If the dashboard API returns
                     * sensor history, support it.
                     */

                    apiRooms.forEach(
                        (apiRoom) => {

                            const roomId =
                                apiRoom?.room_id ||
                                apiRoom?.roomId;


                            const index =
                                baseRooms.findIndex(
                                    (room) =>
                                        room.room_id ===
                                        roomId
                                );


                            if (
                                index ===
                                -1
                            ) {
                                return;
                            }


                            const room =
                                baseRooms[
                                index
                                ];


                            const history =
                                apiRoom?.history ||
                                apiRoom?.sensor_history ||
                                [];


                            if (
                                Array.isArray(
                                    history
                                ) &&
                                history.length >
                                0
                            ) {

                                const sortedHistory =
                                    [
                                        ...history,
                                    ]
                                        .sort(
                                            (
                                                a,
                                                b
                                            ) =>
                                                new Date(
                                                    a.timestamp
                                                ) -
                                                new Date(
                                                    b.timestamp
                                                )
                                        )
                                        .slice(
                                            -MAX_CHART_POINTS
                                        );


                                room.temperature_history =
                                    sortedHistory.map(
                                        (
                                            item
                                        ) => ({
                                            timestamp:
                                                item.timestamp,

                                            time:
                                                formatTime(
                                                    item.timestamp
                                                ),

                                            value:
                                                normalizeNumber(
                                                    item.temperature
                                                ),
                                        })
                                    );


                                room.humidity_history =
                                    sortedHistory.map(
                                        (
                                            item
                                        ) => ({
                                            timestamp:
                                                item.timestamp,

                                            time:
                                                formatTime(
                                                    item.timestamp
                                                ),

                                            value:
                                                normalizeNumber(
                                                    item.humidity
                                                ),
                                        })
                                    );


                                room.gas_history =
                                    sortedHistory.map(
                                        (
                                            item
                                        ) => ({
                                            timestamp:
                                                item.timestamp,

                                            time:
                                                formatTime(
                                                    item.timestamp
                                                ),

                                            value:
                                                normalizeNumber(
                                                    item.gas_level
                                                ),
                                        })
                                    );
                            }

                        }
                    );


                    roomsRef.current =
                        baseRooms;


                    if (
                        mountedRef.current
                    ) {

                        setRooms(
                            baseRooms
                        );


                        const latestTimestamp =
                            baseRooms
                                .map(
                                    (
                                        room
                                    ) =>
                                        room.timestamp
                                )
                                .filter(
                                    Boolean
                                )
                                .sort()
                                .pop();


                        if (
                            latestTimestamp
                        ) {

                            setLastUpdate(
                                latestTimestamp
                            );
                        }
                    }

                } catch (
                error
                ) {

                    console.error(
                        "Initial dashboard API failed:",
                        error
                    );


                    if (
                        mountedRef.current
                    ) {

                        setApiError(
                            "Unable to load initial dashboard data. Waiting for live sensor updates..."
                        );
                    }

                } finally {

                    if (
                        mountedRef.current
                    ) {

                        setLoading(
                            false
                        );
                    }
                }

            },
            []
        );


    /* =====================================================
       SHARED WEBSOCKET MESSAGE HANDLER
    ===================================================== */

    const handleWebSocketMessage =
        useCallback(
            (message) => {

                if (
                    !mountedRef.current
                ) {
                    return;
                }


                /*
                 * Backend sends a connection
                 * message immediately after the
                 * shared WebSocket connects.
                 */

                if (
                    message?.type ===
                    "connection"
                ) {

                    console.log(
                        "[Dashboard] Shared WebSocket connected"
                    );


                    setConnectionStatus(
                        "Connected"
                    );


                    return;
                }


                /*
                 * Dashboard only processes
                 * sensor_update messages.
                 */

                if (
                    message?.type !==
                    "sensor_update"
                ) {

                    return;
                }


                console.log(
                    "[Dashboard] Shared WebSocket update:",
                    message
                );


                applySensorUpdate(
                    message
                );


                setConnectionStatus(
                    "Connected"
                );
            },
            [
                applySensorUpdate,
            ]
        );


    /* =====================================================
       INITIALIZE DASHBOARD
    ===================================================== */

    useEffect(() => {

        mountedRef.current =
            true;


        setConnectionStatus(
            "Connecting..."
        );


        fetchInitialData();


        /*
         * Register Dashboard as a listener
         * on the shared WebSocket.
         */

        connectWebSocket(
            handleWebSocketMessage
        );


        return () => {

            mountedRef.current =
                false;


            /*
             * Remove only Dashboard's listener.
             *
             * The physical WebSocket remains
             * active if another page is using it.
             */

            disconnectWebSocket(
                handleWebSocketMessage
            );


            setConnectionStatus(
                "Disconnected"
            );
        };

    }, [
        fetchInitialData,
        handleWebSocketMessage,
    ]);


    /* =====================================================
       DASHBOARD SUMMARY
    ===================================================== */

    const summary =
        useMemo(
            () => {

                const totalRooms =
                    rooms.length;


                const occupiedRooms =
                    rooms.filter(
                        (room) =>
                            room.occupancy ===
                            "Occupied"
                    ).length;


                const vacantRooms =
                    rooms.filter(
                        (room) =>
                            room.occupancy !==
                            "Occupied"
                    ).length;


                const warningRooms =
                    rooms.filter(
                        (room) =>
                            room.status ===
                            "Warning"
                    ).length;


                const criticalRooms =
                    rooms.filter(
                        (room) =>
                            room.status ===
                            "Critical"
                    ).length;


                const normalRooms =
                    rooms.filter(
                        (room) =>
                            room.status ===
                            "Normal"
                    ).length;


                const temperatures =
                    rooms
                        .map(
                            (room) =>
                                Number(
                                    room.temperature
                                )
                        )
                        .filter(
                            Number.isFinite
                        );


                const humidities =
                    rooms
                        .map(
                            (room) =>
                                Number(
                                    room.humidity
                                )
                        )
                        .filter(
                            Number.isFinite
                        );


                const averageTemperature =
                    temperatures.length
                        ? temperatures.reduce(
                            (
                                sum,
                                value
                            ) =>
                                sum +
                                value,
                            0
                        ) /
                        temperatures.length
                        : 0;


                const averageHumidity =
                    humidities.length
                        ? humidities.reduce(
                            (
                                sum,
                                value
                            ) =>
                                sum +
                                value,
                            0
                        ) /
                        humidities.length
                        : 0;


                return {
                    totalRooms,

                    occupiedRooms,

                    vacantRooms,

                    warningRooms,

                    criticalRooms,

                    normalRooms,

                    averageTemperature,

                    averageHumidity,
                };

            },
            [rooms]
        );


    /* =====================================================
       CHART DATA
    ===================================================== */

    const temperatureChart =
        useMemo(
            () => {

                const points =
                    [];


                rooms.forEach(
                    (room) => {

                        (
                            room.temperature_history ||
                            []
                        ).forEach(
                            (item) => {

                                points.push({
                                    timestamp:
                                        item.timestamp,

                                    time:
                                        item.time,

                                    value:
                                        normalizeNumber(
                                            item.value
                                        ),
                                });

                            }
                        );

                    }
                );


                return points
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            new Date(
                                a.timestamp
                            ) -
                            new Date(
                                b.timestamp
                            )
                    )
                    .slice(
                        -MAX_CHART_POINTS
                    );

            },
            [rooms]
        );


    const humidityChart =
        useMemo(
            () => {

                const points =
                    [];


                rooms.forEach(
                    (room) => {

                        (
                            room.humidity_history ||
                            []
                        ).forEach(
                            (item) => {

                                points.push({
                                    timestamp:
                                        item.timestamp,

                                    time:
                                        item.time,

                                    value:
                                        normalizeNumber(
                                            item.value
                                        ),
                                });

                            }
                        );

                    }
                );


                return points
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            new Date(
                                a.timestamp
                            ) -
                            new Date(
                                b.timestamp
                            )
                    )
                    .slice(
                        -MAX_CHART_POINTS
                    );

            },
            [rooms]
        );


    const gasChart =
        useMemo(
            () => {

                const points =
                    [];


                rooms.forEach(
                    (room) => {

                        (
                            room.gas_history ||
                            []
                        ).forEach(
                            (item) => {

                                points.push({
                                    timestamp:
                                        item.timestamp,

                                    time:
                                        item.time,

                                    value:
                                        normalizeNumber(
                                            item.value
                                        ),
                                });

                            }
                        );

                    }
                );


                return points
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            new Date(
                                a.timestamp
                            ) -
                            new Date(
                                b.timestamp
                            )
                    )
                    .slice(
                        -MAX_CHART_POINTS
                    );

            },
            [rooms]
        );


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <Layout>

            <Box
                sx={{
                    width: "100%",

                    minWidth: 0,

                    boxSizing:
                        "border-box",

                    bgcolor:
                        "#f4f7fb",

                    minHeight:
                        "100%",
                }}
            >

                <Box
                    sx={{
                        width: "100%",

                        maxWidth:
                            "1280px",

                        mx: "auto",

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
                                fontWeight: 800,

                                fontSize: {
                                    xs: "1.8rem",
                                    sm: "2.1rem",
                                    md: "2.35rem",
                                },

                                lineHeight: 1.15,

                                color:
                                    "text.primary",
                            }}
                        >
                            AI Digital Twin Building
                        </Typography>


                        <Typography
                            variant="body1"
                            sx={{
                                color:
                                    "text.secondary",

                                mt: 0.75,
                            }}
                        >
                            Real-time building
                            monitoring, safety
                            analysis and AI
                            insights
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
                                label={`WebSocket: ${connectionStatus}`}
                                color={
                                    connectionStatus ===
                                        "Connected"
                                        ? "success"
                                        : connectionStatus ===
                                            "Connecting..."
                                            ? "warning"
                                            : "default"
                                }
                                size="small"
                                sx={{
                                    fontWeight:
                                        600,
                                }}
                            />


                            <Chip
                                label={`${summary.totalRooms} rooms online`}
                                size="small"
                                variant="outlined"
                            />

                        </Box>

                    </Box>


                    {/* =================================================
                        API ERROR
                    ================================================= */}

                    {apiError && (

                        <Alert
                            severity="info"
                            sx={{
                                mb: 2,
                            }}
                        >
                            {apiError}
                        </Alert>

                    )}


                    {/* =================================================
                        TOP SUMMARY CARDS
                    ================================================= */}

                    <Box
                        sx={{
                            display:
                                "grid",

                            gridTemplateColumns:
                            {
                                xs: "1fr",

                                sm:
                                    "repeat(2, minmax(0, 1fr))",

                                md:
                                    "repeat(4, minmax(0, 1fr))",
                            },

                            gap: 2,

                            width: "100%",

                            mb: 3,
                        }}
                    >

                        <SummaryCard
                            title="Total Rooms"
                            value={
                                summary.totalRooms
                            }
                            subtitle="Configured rooms"
                            chipLabel="System"
                        />


                        <SummaryCard
                            title="Occupied Rooms"
                            value={
                                summary.occupiedRooms
                            }
                            subtitle="Currently occupied"
                            chipLabel="Live"
                        />


                        <SummaryCard
                            title="Warning Rooms"
                            value={
                                summary.warningRooms
                            }
                            subtitle="Require attention"
                            chipLabel="Warning"
                            chipColor="warning"
                        />


                        <SummaryCard
                            title="Critical Rooms"
                            value={
                                summary.criticalRooms
                            }
                            subtitle="Immediate attention"
                            chipLabel="Critical"
                            chipColor="error"
                        />


                        <SummaryCard
                            title="Normal Rooms"
                            value={
                                summary.normalRooms
                            }
                            subtitle="Normal conditions"
                            chipLabel="Normal"
                            chipColor="success"
                        />


                        <SummaryCard
                            title="Vacant Rooms"
                            value={
                                summary.vacantRooms
                            }
                            subtitle="Currently vacant"
                            chipLabel="Live"
                        />


                        <SummaryCard
                            title="Average Temperature"
                            value={`${summary.averageTemperature.toFixed(
                                2
                            )} °C`}
                            subtitle="Across all rooms"
                            chipLabel="Live"
                        />


                        <SummaryCard
                            title="Average Humidity"
                            value={`${summary.averageHumidity.toFixed(
                                2
                            )} %`}
                            subtitle="Across all rooms"
                            chipLabel="Live"
                            chipColor="success"
                        />

                    </Box>


                    {/* =================================================
                        ROOM MONITORING
                    ================================================= */}

                    <Box
                        component="section"
                        sx={{
                            width:
                                "100%",

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
                            Room Monitoring
                        </Typography>


                        <Box
                            sx={{
                                display:
                                    "grid",

                                gridTemplateColumns:
                                {
                                    xs: "1fr",

                                    sm:
                                        "repeat(2, minmax(0, 1fr))",

                                    md:
                                        "repeat(3, minmax(0, 1fr))",
                                },

                                gap: 2,

                                width:
                                    "100%",
                            }}
                        >

                            {rooms.map(
                                (
                                    room
                                ) => (

                                    <RoomMonitoringCard
                                        key={
                                            room.room_id
                                        }
                                        room={
                                            room
                                        }
                                    />

                                )
                            )}

                        </Box>

                    </Box>


                    {/* =================================================
                        LIVE SENSOR ANALYTICS
                    ================================================= */}

                    <Box
                        component="section"
                        sx={{
                            width:
                                "100%",

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
                            Live Sensor Analytics
                        </Typography>


                        <Box
                            sx={{
                                display:
                                    "grid",

                                gridTemplateColumns:
                                {
                                    xs: "1fr",

                                    md:
                                        "repeat(3, minmax(0, 1fr))",
                                },

                                gap: 2,

                                width:
                                    "100%",
                            }}
                        >

                            <LiveChart
                                title="Temperature"
                                data={
                                    temperatureChart
                                }
                                unit="°C"
                                lineColor="#1976d2"
                            />


                            <LiveChart
                                title="Humidity"
                                data={
                                    humidityChart
                                }
                                unit="%"
                                lineColor="#2e7d32"
                            />


                            <LiveChart
                                title="Gas Sensor"
                                data={
                                    gasChart
                                }
                                unit="ADC"
                                lineColor="#ed6c02"
                            />

                        </Box>

                    </Box>


                    {/* =================================================
                        LIVE ALERTS
                    ================================================= */}

                    <Box
                        component="section"
                        sx={{
                            width:
                                "100%",

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
                            Live Alerts
                        </Typography>


                        <LiveAlerts
                            rooms={
                                rooms
                            }
                        />

                    </Box>


                    {/* =================================================
                        AI INSIGHTS
                    ================================================= */}

                    <Box
                        component="section"
                        sx={{
                            width:
                                "100%",

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
                            AI Insights
                        </Typography>


                        <AIInsights
                            rooms={
                                rooms
                            }
                        />

                    </Box>


                    {/* =================================================
                        FOOTER
                    ================================================= */}

                    <Box
                        sx={{
                            display:
                                "flex",

                            justifyContent:
                                "flex-end",

                            width:
                                "100%",

                            pt: 1,
                        }}
                    >

                        <Typography
                            variant="caption"
                            sx={{
                                color:
                                    "text.secondary",
                            }}
                        >
                            Last live update:{" "}
                            {
                                lastUpdate
                                    ? formatTime(
                                        lastUpdate
                                    )
                                    : "--:--:--"
                            }
                        </Typography>

                    </Box>


                    {/* =================================================
                        LOADING INDICATOR
                    ================================================= */}

                    {loading && (

                        <Box
                            sx={{
                                position:
                                    "fixed",

                                right: 20,

                                bottom: 20,

                                zIndex: 20,
                            }}
                        >

                            <Paper
                                elevation={4}
                                sx={{
                                    px: 2,

                                    py: 1,

                                    display:
                                        "flex",

                                    alignItems:
                                        "center",

                                    gap: 1,

                                    borderRadius:
                                        2,
                                }}
                            >

                                <CircularProgress
                                    size={18}
                                />


                                <Typography
                                    variant="body2"
                                >
                                    Loading live
                                    building data...
                                </Typography>

                            </Paper>

                        </Box>

                    )}

                </Box>

            </Box>

        </Layout>
    );
}
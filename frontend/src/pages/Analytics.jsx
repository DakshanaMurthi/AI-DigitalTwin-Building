import { useEffect, useMemo, useState } from "react";

import {
    Alert,
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
} from "@mui/material";

import {
    BarChart,
    Bar,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    PolarAngleAxis,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import Layout from "../components/Layout";

import {
    connectWebSocket,
    disconnectWebSocket,
} from "../services/websocket";


// ============================================================
// CONFIGURATION
// ============================================================

const API_BASE_URL = "http://127.0.0.1:8000";

const ROOMS = [
    {
        id: "RECEPTION",
        name: "Reception",
    },
    {
        id: "WORKSPACE",
        name: "Workspace",
    },
    {
        id: "MANAGER_CABIN",
        name: "Manager Cabin",
    },
];

const GAS_WARNING_THRESHOLD = 1500;
const GAS_CRITICAL_THRESHOLD = 2000;

const MAX_HISTORY_POINTS = 300;


// ============================================================
// HELPERS
// ============================================================

function roomName(roomId) {
    const room = ROOMS.find(
        (item) => item.id === roomId
    );

    return room ? room.name : roomId;
}


function normalizeSensorRecord(record) {
    if (!record) {
        return null;
    }

    return {
        id:
            record.id ??
            record._id ??
            null,

        room_id:
            record.room_id ??
            record.roomId ??
            "",

        temperature:
            Number(
                record.temperature ?? 0
            ),

        humidity:
            Number(
                record.humidity ?? 0
            ),

        gas_level:
            Number(
                record.gas_level ??
                record.gasLevel ??
                0
            ),

        motion_detected:
            Boolean(
                record.motion_detected ??
                record.motionDetected ??
                false
            ),

        timestamp:
            record.timestamp ??
            new Date().toISOString(),
    };
}


function calculateStatus(record) {
    if (!record) {
        return "Normal";
    }

    const temperature =
        Number(
            record.temperature ?? 0
        );

    const humidity =
        Number(
            record.humidity ?? 0
        );

    const gas =
        Number(
            record.gas_level ?? 0
        );

    if (
        temperature >= 40 ||
        gas >= GAS_CRITICAL_THRESHOLD
    ) {
        return "Critical";
    }

    if (
        temperature >= 35 ||
        humidity >= 80 ||
        gas >= GAS_WARNING_THRESHOLD
    ) {
        return "Warning";
    }

    return "Normal";
}


function statusColor(status) {
    switch (status) {
        case "Critical":
            return "error";

        case "Warning":
            return "warning";

        default:
            return "success";
    }
}


function average(values) {
    const validValues =
        values.filter(
            (value) =>
                Number.isFinite(
                    Number(value)
                )
        );

    if (!validValues.length) {
        return 0;
    }

    return (
        validValues.reduce(
            (sum, value) =>
                sum + Number(value),
            0
        ) /
        validValues.length
    );
}


function minimum(values) {
    const validValues =
        values.filter(
            (value) =>
                Number.isFinite(
                    Number(value)
                )
        );

    if (!validValues.length) {
        return 0;
    }

    return Math.min(
        ...validValues
    );
}


function maximum(values) {
    const validValues =
        values.filter(
            (value) =>
                Number.isFinite(
                    Number(value)
                )
        );

    if (!validValues.length) {
        return 0;
    }

    return Math.max(
        ...validValues
    );
}


function formatNumber(
    value,
    digits = 1
) {
    if (
        value === null ||
        value === undefined ||
        !Number.isFinite(
            Number(value)
        )
    ) {
        return "--";
    }

    return Number(value).toFixed(
        digits
    );
}


function formatTime(timestamp) {
    if (!timestamp) {
        return "--";
    }

    const date =
        new Date(timestamp);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "--";
    }

    return date.toLocaleTimeString();
}


function buildEnvironmentalTrendData(records) {
    const buckets = new Map();

    records.forEach((record) => {
        const date = new Date(record.timestamp);

        if (Number.isNaN(date.getTime())) {
            return;
        }

        const bucketTime = new Date(
            Math.floor(date.getTime() / 1000) * 1000
        ).toISOString();

        if (!buckets.has(bucketTime)) {
            buckets.set(bucketTime, {
                timestamp: bucketTime,
                temperatures: [],
                humidities: [],
                gasLevels: [],
            });
        }

        const bucket = buckets.get(bucketTime);

        if (Number.isFinite(Number(record.temperature))) {
            bucket.temperatures.push(Number(record.temperature));
        }
        if (Number.isFinite(Number(record.humidity))) {
            bucket.humidities.push(Number(record.humidity));
        }
        if (Number.isFinite(Number(record.gas_level))) {
            bucket.gasLevels.push(Number(record.gas_level));
        }
    });

    const average = (values) =>
        values.length
            ? values.reduce((sum, value) => sum + value, 0) / values.length
            : null;

    return Array.from(buckets.values())
        .sort(
            (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
        )
        .map((bucket) => ({
            timestamp: bucket.timestamp,
            temperature: average(bucket.temperatures),
            humidity: average(bucket.humidities),
            gas_level: average(bucket.gasLevels),
        }));
}


// ============================================================
// REUSABLE UI COMPONENTS
// ============================================================

function MetricCard({
    title,
    value,
    unit,
    subtitle,
}) {
    return (
        <Card
            sx={{
                height: "100%",
            }}
        >
            <CardContent>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mb: 1,
                    }}
                >
                    {title}
                </Typography>


                <Stack
                    direction="row"
                    alignItems="baseline"
                    spacing={0.5}
                >

                    <Typography
                        variant="h4"
                        fontWeight={700}
                    >
                        {value}
                    </Typography>


                    {unit && (
                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            {unit}
                        </Typography>
                    )}

                </Stack>


                {subtitle && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        {subtitle}
                    </Typography>
                )}

            </CardContent>
        </Card>
    );
}


function SectionCard({
    title,
    subtitle,
    children,
    sx,
}) {
    return (
        <Card
            sx={{
                height: "100%",
                ...sx,
            }}
        >
            <CardContent>

                <Typography
                    variant="h6"
                    fontWeight={700}
                >
                    {title}
                </Typography>


                {subtitle && (
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            mt: 0.5,
                            mb: 2,
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}


                {!subtitle && (
                    <Box
                        sx={{
                            mb: 2,
                        }}
                    />
                )}


                {children}

            </CardContent>
        </Card>
    );
}


// ============================================================
// LIVE ENVIRONMENTAL PULSE COMPONENTS
// ============================================================

function CircularPulseGauge({
    title,
    value,
    unit,
    maxValue,
    color,
    subtitle,
}) {
    const safeValue =
        Number.isFinite(Number(value))
            ? Number(value)
            : 0;

    const safeMax =
        Number.isFinite(Number(maxValue)) &&
            Number(maxValue) > 0
            ? Number(maxValue)
            : 100;

    const percentage =
        Math.min(
            Math.max(
                (safeValue / safeMax) * 100,
                0
            ),
            100
        );

    const degrees =
        percentage * 3.6;

    return (
        <Card
            sx={{
                height: "100%",
                borderRadius: 2,
                overflow: "hidden",
            }}
        >

            <CardContent
                sx={{
                    p: 2.25,
                    "&:last-child": {
                        pb: 2.25,
                    },
                }}
            >

                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                        mb: 1,
                    }}
                >

                    <Typography
                        variant="body2"
                        fontWeight={700}
                    >
                        {title}
                    </Typography>


                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: "#2e7d32",
                            animation:
                                "pulseLive 1.8s infinite",
                            "@keyframes pulseLive": {
                                "0%": {
                                    boxShadow:
                                        "0 0 0 0 rgba(46,125,50,0.45)",
                                },
                                "70%": {
                                    boxShadow:
                                        "0 0 0 8px rgba(46,125,50,0)",
                                },
                                "100%": {
                                    boxShadow:
                                        "0 0 0 0 rgba(46,125,50,0)",
                                },
                            },
                        }}
                    />

                </Stack>


                <Box
                    sx={{
                        width: 145,
                        height: 145,
                        borderRadius: "50%",
                        mx: "auto",
                        my: 1.5,
                        display: "grid",
                        placeItems: "center",
                        position: "relative",
                        background: `conic-gradient(
                            ${color} 0deg ${degrees}deg,
                            #edf0f4 ${degrees}deg 360deg
                        )`,
                        transition:
                            "background 0.8s ease",
                    }}
                >

                    <Box
                        sx={{
                            width: 103,
                            height: 103,
                            borderRadius: "50%",
                            bgcolor: "background.paper",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            position: "relative",
                            zIndex: 1,
                        }}
                    >

                        <Typography
                            sx={{
                                fontSize: 27,
                                fontWeight: 700,
                                lineHeight: 1.1,
                            }}
                        >
                            {formatNumber(
                                safeValue,
                                1
                            )}
                        </Typography>


                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            {unit}
                        </Typography>

                    </Box>

                </Box>


                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                >

                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        Current
                    </Typography>


                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        {subtitle}
                    </Typography>

                </Stack>

            </CardContent>

        </Card>
    );
}


function GasPulseMeter({
    value,
}) {
    const safeValue =
        Number.isFinite(Number(value))
            ? Number(value)
            : 0;

    const percentage =
        Math.min(
            Math.max(
                (safeValue /
                    GAS_CRITICAL_THRESHOLD) *
                100,
                0
            ),
            100
        );

    let status =
        "Normal";

    let statusColor =
        "#2e7d32";

    if (
        safeValue >=
        GAS_CRITICAL_THRESHOLD
    ) {
        status =
            "Critical";

        statusColor =
            "#d32f2f";
    } else if (
        safeValue >=
        GAS_WARNING_THRESHOLD
    ) {
        status =
            "Warning";

        statusColor =
            "#ed6c02";
    }

    return (
        <Card
            sx={{
                height: "100%",
                borderRadius: 2,
            }}
        >

            <CardContent
                sx={{
                    p: 2.25,
                    "&:last-child": {
                        pb: 2.25,
                    },
                }}
            >

                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >

                    <Typography
                        variant="body2"
                        fontWeight={700}
                    >
                        Gas Level
                    </Typography>


                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor:
                                statusColor,
                            animation:
                                "gasPulse 1.8s infinite",
                            "@keyframes gasPulse": {
                                "0%": {
                                    boxShadow:
                                        `0 0 0 0 ${statusColor}55`,
                                },
                                "70%": {
                                    boxShadow:
                                        `0 0 0 8px ${statusColor}00`,
                                },
                                "100%": {
                                    boxShadow:
                                        `0 0 0 0 ${statusColor}00`,
                                },
                            },
                        }}
                    />

                </Stack>


                <Box
                    sx={{
                        mt: 3,
                        mb: 1,
                    }}
                >

                    <Stack
                        direction="row"
                        alignItems="baseline"
                        spacing={0.5}
                    >

                        <Typography
                            variant="h4"
                            fontWeight={700}
                        >
                            {formatNumber(
                                safeValue,
                                0
                            )}
                        </Typography>


                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            ADC
                        </Typography>

                    </Stack>

                </Box>


                <Box
                    sx={{
                        width: "100%",
                        height: 18,
                        bgcolor: "#edf0f4",
                        borderRadius: 99,
                        overflow: "hidden",
                    }}
                >

                    <Box
                        sx={{
                            width:
                                `${percentage}%`,
                            height: "100%",
                            borderRadius: 99,
                            bgcolor:
                                statusColor,
                            transition:
                                "width 0.8s ease, background-color 0.5s ease",
                        }}
                    />

                </Box>


                <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{
                        mt: 1,
                    }}
                >

                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        0
                    </Typography>


                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        Warning 1500
                    </Typography>


                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        Critical 2000
                    </Typography>

                </Stack>


                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                        mt: 2,
                    }}
                >

                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        MQ-2 raw reading
                    </Typography>


                    <Chip
                        label={status}
                        size="small"
                        sx={{
                            bgcolor:
                                `${statusColor}18`,
                            color:
                                statusColor,
                            fontWeight: 700,
                        }}
                    />

                </Stack>

            </CardContent>

        </Card>
    );
}


function OccupancyPulse({
    occupied,
    totalRooms,
    selectedRoom,
    motionDetected,
}) {
    const isSelectedRoom =
        selectedRoom !== "ALL";

    const isOccupied =
        isSelectedRoom
            ? Boolean(motionDetected)
            : occupied > 0;

    const green =
        "#2e7d32";

    const grey =
        "#9e9e9e";

    const color =
        isOccupied
            ? green
            : grey;

    return (
        <Card
            sx={{
                height: "100%",
                borderRadius: 2,
            }}
        >

            <CardContent
                sx={{
                    p: 2.25,
                    "&:last-child": {
                        pb: 2.25,
                    },
                }}
            >

                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                >

                    <Typography
                        variant="body2"
                        fontWeight={700}
                    >
                        Occupancy
                    </Typography>


                    <Box
                        sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: color,
                            animation:
                                "occupancyPulse 1.8s infinite",
                            "@keyframes occupancyPulse": {
                                "0%": {
                                    boxShadow:
                                        `0 0 0 0 ${color}55`,
                                },
                                "70%": {
                                    boxShadow:
                                        `0 0 0 8px ${color}00`,
                                },
                                "100%": {
                                    boxShadow:
                                        `0 0 0 0 ${color}00`,
                                },
                            },
                        }}
                    />

                </Stack>


                <Box
                    sx={{
                        textAlign: "center",
                        py: 2,
                    }}
                >

                    <Box
                        sx={{
                            width: 82,
                            height: 82,
                            borderRadius: "50%",
                            mx: "auto",
                            mb: 1.5,
                            display: "grid",
                            placeItems: "center",
                            border:
                                `8px solid ${color}18`,
                            color: color,
                            fontSize: 31,
                            fontWeight: 700,
                            animation:
                                isOccupied
                                    ? "presencePulse 1.8s ease-in-out infinite"
                                    : "none",
                            "@keyframes presencePulse": {
                                "0%": {
                                    transform:
                                        "scale(1)",
                                },
                                "50%": {
                                    transform:
                                        "scale(1.06)",
                                },
                                "100%": {
                                    transform:
                                        "scale(1)",
                                },
                            },
                        }}
                    >
                        ●
                    </Box>


                    <Typography
                        variant="h6"
                        fontWeight={700}
                    >
                        {isSelectedRoom
                            ? (
                                isOccupied
                                    ? "Occupied"
                                    : "Vacant"
                            )
                            : `${occupied} / ${totalRooms}`}
                    </Typography>


                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        {isSelectedRoom
                            ? (
                                isOccupied
                                    ? "PIR sensor detected motion"
                                    : "No PIR motion detected"
                            )
                            : "Rooms currently occupied"
                        }
                    </Typography>

                </Box>


                <Stack
                    direction="row"
                    justifyContent="space-between"
                >

                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        Source
                    </Typography>


                    <Typography
                        variant="caption"
                        fontWeight={600}
                    >
                        PIR sensor
                    </Typography>

                </Stack>

            </CardContent>

        </Card>
    );
}


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function Analytics() {

    // --------------------------------------------------------
    // HISTORICAL DATA
    // --------------------------------------------------------

    const [
        sensorData,
        setSensorData,
    ] = useState([]);


    // --------------------------------------------------------
    // LIVE DATA
    // --------------------------------------------------------

    const [
        liveRooms,
        setLiveRooms,
    ] = useState({});


    const [
        connectionStatus,
        setConnectionStatus,
    ] = useState("Connecting");


    const [
        liveUpdateCount,
        setLiveUpdateCount,
    ] = useState(0);


    const [
        lastLiveUpdate,
        setLastLiveUpdate,
    ] = useState(null);


    const [
        lastLiveRoom,
        setLastLiveRoom,
    ] = useState(null);


    // --------------------------------------------------------
    // PAGE STATE
    // --------------------------------------------------------

    const [
        selectedRoom,
        setSelectedRoom,
    ] = useState("ALL");


    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        error,
        setError,
    ] = useState("");


    // ========================================================
    // LOAD HISTORICAL SENSOR DATA
    // ========================================================

    useEffect(() => {

        let cancelled = false;


        async function loadHistory() {

            try {

                setLoading(true);

                setError("");


                const response =
                    await fetch(
                        `${API_BASE_URL}/sensor-data/history?limit=${MAX_HISTORY_POINTS}`
                    );


                if (!response.ok) {

                    throw new Error(
                        `HTTP ${response.status}`
                    );

                }


                const result =
                    await response.json();


                const rawData =
                    Array.isArray(result)
                        ? result
                        : Array.isArray(
                            result?.data
                        )
                            ? result.data
                            : Array.isArray(
                                result?.data?.items
                            )
                                ? result.data.items
                                : [];


                const normalized =
                    rawData
                        .map(
                            normalizeSensorRecord
                        )
                        .filter(Boolean)
                        .reverse()
                        .slice(
                            -MAX_HISTORY_POINTS
                        );


                if (!cancelled) {

                    setSensorData(
                        normalized
                    );

                }

            } catch (err) {

                console.error(
                    "[Analytics] Failed to load historical data:",
                    err
                );


                if (!cancelled) {

                    setError(
                        "Unable to load historical sensor data."
                    );

                }

            } finally {

                if (!cancelled) {

                    setLoading(false);

                }

            }
        }


        loadHistory();


        return () => {

            cancelled = true;

        };

    }, []);


    // ========================================================
    // SHARED WEBSOCKET
    // ========================================================

    useEffect(() => {

        function handleWebSocketMessage(
            message
        ) {

            if (!message) {
                return;
            }


            // ------------------------------------------------
            // CONNECTION MESSAGE
            // ------------------------------------------------

            if (
                message.type ===
                "connection"
            ) {

                setConnectionStatus(
                    "Live"
                );

                return;
            }


            // ------------------------------------------------
            // SENSOR UPDATE
            // ------------------------------------------------

            if (
                message.type !==
                "sensor_update"
            ) {
                return;
            }


            const normalized =
                normalizeSensorRecord(
                    message
                );


            if (
                !normalized ||
                !normalized.room_id
            ) {
                return;
            }


            // ------------------------------------------------
            // UPDATE CURRENT ROOM STATE
            // ------------------------------------------------

            setLiveRooms(
                (previous) => ({
                    ...previous,

                    [normalized.room_id]:
                        normalized,
                })
            );


            // ------------------------------------------------
            // ADD LIVE RECORD
            // ------------------------------------------------

            setSensorData(
                (previous) => {

                    const updated = [
                        ...previous,
                        normalized,
                    ];


                    return updated.slice(
                        -MAX_HISTORY_POINTS
                    );

                }
            );


            // ------------------------------------------------
            // LIVE ACTIVITY
            // ------------------------------------------------

            setLiveUpdateCount(
                (count) =>
                    count + 1
            );


            setLastLiveUpdate(
                normalized.timestamp
            );


            setLastLiveRoom(
                normalized.room_id
            );


            setConnectionStatus(
                "Live"
            );
        }


        connectWebSocket(
            handleWebSocketMessage
        );


        return () => {

            setConnectionStatus(
                "Connecting"
            );


            disconnectWebSocket(
                handleWebSocketMessage
            );

        };

    }, []);


    // ========================================================
    // LATEST HISTORICAL RECORD BY ROOM
    // ========================================================

    const latestHistoricalByRoom =
        useMemo(() => {

            const result = {};


            sensorData.forEach(
                (record) => {

                    if (
                        !record.room_id
                    ) {
                        return;
                    }


                    result[
                        record.room_id
                    ] = record;

                }
            );


            return result;

        }, [sensorData]);


    // ========================================================
    // CURRENT ROOM DATA
    // ========================================================

    const currentByRoom =
        useMemo(() => {

            const result = {};


            ROOMS.forEach(
                (room) => {

                    result[
                        room.id
                    ] =
                        liveRooms[
                        room.id
                        ] ||
                        latestHistoricalByRoom[
                        room.id
                        ] ||
                        null;

                }
            );


            return result;

        }, [
            liveRooms,
            latestHistoricalByRoom,
        ]);


    // ========================================================
    // SELECTED HISTORICAL DATA
    // ========================================================

    const filteredData =
        useMemo(() => {

            if (
                selectedRoom ===
                "ALL"
            ) {

                return sensorData;

            }


            return sensorData.filter(
                (record) =>
                    record.room_id ===
                    selectedRoom
            );

        }, [
            sensorData,
            selectedRoom,
        ]);



    const environmentalTrendData =
        useMemo(
            () =>
                buildEnvironmentalTrendData(
                    filteredData
                ),
            [filteredData]
        );


    // ========================================================
    // SELECTED ROOM LATEST DATA
    // ========================================================

    const latestSelectedRoom =
        useMemo(() => {

            if (
                selectedRoom ===
                "ALL"
            ) {

                return null;

            }


            return (
                liveRooms[
                selectedRoom
                ] ||
                latestHistoricalByRoom[
                selectedRoom
                ] ||
                null
            );

        }, [
            selectedRoom,
            liveRooms,
            latestHistoricalByRoom,
        ]);


    // ========================================================
    // BUILDING KPI DATA
    // ========================================================

    const buildingMetrics =
        useMemo(() => {

            const currentRecords =
                ROOMS
                    .map(
                        (room) =>
                            currentByRoom[
                            room.id
                            ]
                    )
                    .filter(Boolean);


            const temperatures =
                currentRecords.map(
                    (item) =>
                        item.temperature
                );


            const humidities =
                currentRecords.map(
                    (item) =>
                        item.humidity
                );


            const gasLevels =
                currentRecords.map(
                    (item) =>
                        item.gas_level
                );


            const occupiedRooms =
                currentRecords.filter(
                    (item) =>
                        item.motion_detected
                ).length;


            const risks =
                currentRecords.map(
                    (item) => {

                        const temperature =
                            Number(
                                item.temperature
                            );


                        const humidity =
                            Number(
                                item.humidity
                            );


                        const gas =
                            Number(
                                item.gas_level
                            );


                        let risk = 0;


                        if (
                            temperature >= 40
                        ) {

                            risk += 40;

                        } else if (
                            temperature >= 35
                        ) {

                            risk += 20;

                        }


                        if (
                            humidity >= 80
                        ) {

                            risk += 15;

                        }


                        if (
                            gas >=
                            GAS_CRITICAL_THRESHOLD
                        ) {

                            risk += 50;

                        } else if (
                            gas >=
                            GAS_WARNING_THRESHOLD
                        ) {

                            risk += 25;

                        }


                        if (
                            item.motion_detected
                        ) {

                            risk += 5;

                        }


                        return Math.min(
                            risk,
                            100
                        );

                    }
                );


            return {

                averageTemperature:
                    average(
                        temperatures
                    ),

                averageHumidity:
                    average(
                        humidities
                    ),

                averageGas:
                    average(
                        gasLevels
                    ),

                occupiedRooms,

                occupancyRate:
                    currentRecords.length
                        ? (
                            occupiedRooms /
                            currentRecords.length
                        ) *
                        100
                        : 0,

                maximumRisk:
                    maximum(risks),

            };

        }, [
            currentByRoom,
        ]);


    // ========================================================
    // LIVE ENVIRONMENTAL PULSE DATA
    // ========================================================

    const livePulseData =
        useMemo(() => {

            if (
                selectedRoom !==
                "ALL"
            ) {

                return {

                    label:
                        roomName(
                            selectedRoom
                        ),

                    temperature:
                        latestSelectedRoom
                            ? Number(
                                latestSelectedRoom.temperature
                            )
                            : 0,

                    humidity:
                        latestSelectedRoom
                            ? Number(
                                latestSelectedRoom.humidity
                            )
                            : 0,

                    gas:
                        latestSelectedRoom
                            ? Number(
                                latestSelectedRoom.gas_level
                            )
                            : 0,

                    occupied:
                        latestSelectedRoom
                            ?.motion_detected
                            ? 1
                            : 0,

                    motionDetected:
                        Boolean(
                            latestSelectedRoom
                                ?.motion_detected
                        ),

                };

            }


            return {

                label:
                    "Building Average",

                temperature:
                    buildingMetrics.averageTemperature,

                humidity:
                    buildingMetrics.averageHumidity,

                gas:
                    buildingMetrics.averageGas,

                occupied:
                    buildingMetrics.occupiedRooms,

                motionDetected:
                    false,

            };

        }, [
            selectedRoom,
            latestSelectedRoom,
            buildingMetrics,
        ]);


    // ========================================================
    // ROOM RISK DATA
    // ========================================================

    const riskData =
        useMemo(() => {

            return ROOMS.map(
                (room) => {

                    const data =
                        currentByRoom[
                        room.id
                        ];


                    if (!data) {

                        return {

                            room:
                                room.name,

                            risk:
                                0,

                            status:
                                "Normal",

                        };

                    }


                    const temperature =
                        Number(
                            data.temperature
                        );


                    const humidity =
                        Number(
                            data.humidity
                        );


                    const gas =
                        Number(
                            data.gas_level
                        );


                    let risk = 0;


                    if (
                        temperature >= 40
                    ) {

                        risk += 40;

                    } else if (
                        temperature >= 35
                    ) {

                        risk += 20;

                    }


                    if (
                        humidity >= 80
                    ) {

                        risk += 15;

                    }


                    if (
                        gas >=
                        GAS_CRITICAL_THRESHOLD
                    ) {

                        risk += 50;

                    } else if (
                        gas >=
                        GAS_WARNING_THRESHOLD
                    ) {

                        risk += 25;

                    }


                    if (
                        data.motion_detected
                    ) {

                        risk += 5;

                    }


                    risk =
                        Math.min(
                            risk,
                            100
                        );


                    return {

                        room:
                            room.name,

                        risk,

                        status:
                            calculateStatus(
                                data
                            ),

                    };

                }
            );

        }, [
            currentByRoom,
        ]);


    // ========================================================
    // OCCUPANCY DATA
    // ========================================================

    const occupancyData =
        useMemo(() => {

            const occupied =
                ROOMS.filter(
                    (room) =>
                        currentByRoom[
                            room.id
                        ]?.motion_detected
                ).length;


            const vacant =
                Math.max(
                    ROOMS.length -
                    occupied,
                    0
                );


            return [

                {
                    name:
                        "Occupied",

                    value:
                        occupied,
                },

                {
                    name:
                        "Vacant",

                    value:
                        vacant,
                },

            ];

        }, [
            currentByRoom,
        ]);


    // ========================================================
    // BUILDING HEALTH
    // ========================================================

    const buildingHealth =
        useMemo(() => {

            const value =
                Math.min(
                    Number(
                        buildingMetrics.maximumRisk
                    ),
                    100
                );


            return [

                {
                    name:
                        "Risk",

                    value,

                    fill:
                        value >= 70
                            ? "#d32f2f"
                            : value >= 35
                                ? "#ed6c02"
                                : "#2e7d32",
                },

            ];

        }, [
            buildingMetrics.maximumRisk,
        ]);


    // ========================================================
    // SELECTED ROOM STATISTICS
    // ========================================================

    const selectedRoomStats =
        useMemo(() => {

            if (
                selectedRoom ===
                "ALL"
            ) {

                return null;

            }


            const temperatures =
                filteredData.map(
                    (item) =>
                        item.temperature
                );


            const humidities =
                filteredData.map(
                    (item) =>
                        item.humidity
                );


            const gasLevels =
                filteredData.map(
                    (item) =>
                        item.gas_level
                );


            return {

                averageTemperature:
                    average(
                        temperatures
                    ),

                minimumTemperature:
                    minimum(
                        temperatures
                    ),

                maximumTemperature:
                    maximum(
                        temperatures
                    ),

                averageHumidity:
                    average(
                        humidities
                    ),

                minimumHumidity:
                    minimum(
                        humidities
                    ),

                maximumHumidity:
                    maximum(
                        humidities
                    ),

                averageGas:
                    average(
                        gasLevels
                    ),

                minimumGas:
                    minimum(
                        gasLevels
                    ),

                maximumGas:
                    maximum(
                        gasLevels
                    ),

            };

        }, [
            selectedRoom,
            filteredData,
        ]);


    // ========================================================
    // RECENT SELECTED ROOM DATA
    // ========================================================

    const recentSelectedData =
        useMemo(() => {

            if (
                selectedRoom ===
                "ALL"
            ) {

                return [];

            }


            return filteredData
                .slice(-12)
                .map(
                    (
                        record,
                        index
                    ) => ({

                        index:
                            index + 1,

                        temperature:
                            Number(
                                record.temperature
                            ),

                        humidity:
                            Number(
                                record.humidity
                            ),

                        gas:
                            Number(
                                record.gas_level
                            ),

                    })
                );

        }, [
            selectedRoom,
            filteredData,
        ]);


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <Layout>

            <Box
                sx={{
                    p: {
                        xs: 2,
                        md: 3,
                    },
                }}
            >

                {/* ==================================================
                    HEADER
                ================================================== */}

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
                    sx={{
                        mb: 3,
                    }}
                >

                    <Box>

                        <Typography
                            variant="h4"
                            fontWeight={700}
                        >
                            Analytics
                        </Typography>


                        <Typography
                            variant="body1"
                            color="text.secondary"
                            sx={{
                                mt: 0.5,
                            }}
                        >
                            Historical and comparative
                            analysis of building sensor
                            data
                        </Typography>

                    </Box>


                    <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                    >

                        <Chip
                            label={
                                connectionStatus ===
                                    "Live"
                                    ? "● LIVE"
                                    : "CONNECTING"
                            }
                            color={
                                connectionStatus ===
                                    "Live"
                                    ? "success"
                                    : "warning"
                            }
                            variant="outlined"
                        />


                        <Chip
                            label={`${liveUpdateCount} live updates`}
                            variant="outlined"
                        />

                    </Stack>

                </Stack>


                {/* ==================================================
                    LIVE CONNECTION INFORMATION
                ================================================== */}

                <Alert
                    severity={
                        connectionStatus ===
                            "Live"
                            ? "success"
                            : "warning"
                    }
                    sx={{
                        mb: 3,
                    }}
                >

                    <Stack
                        direction={{
                            xs: "column",
                            sm: "row",
                        }}
                        spacing={{
                            xs: 0.5,
                            sm: 3,
                        }}
                    >

                        <Typography
                            variant="body2"
                        >
                            WebSocket:{" "}

                            <strong>
                                {
                                    connectionStatus
                                }
                            </strong>
                        </Typography>


                        <Typography
                            variant="body2"
                        >
                            Last room:{" "}

                            <strong>
                                {
                                    lastLiveRoom
                                        ? roomName(
                                            lastLiveRoom
                                        )
                                        : "--"
                                }
                            </strong>
                        </Typography>


                        <Typography
                            variant="body2"
                        >
                            Last update:{" "}

                            <strong>
                                {formatTime(
                                    lastLiveUpdate
                                )}
                            </strong>
                        </Typography>

                    </Stack>

                </Alert>


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (

                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                        }}
                    >
                        {error}
                    </Alert>

                )}


                {/* ==================================================
                    ANALYSIS CONTROLS
                ================================================== */}

                <Card
                    sx={{
                        mb: 3,
                    }}
                >

                    <CardContent>

                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{
                                mb: 2,
                            }}
                        >
                            Analysis Controls
                        </Typography>


                        <Grid
                            container
                            spacing={2}
                        >

                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 4,
                                }}
                            >

                                <FormControl
                                    fullWidth
                                >

                                    <InputLabel>
                                        Room
                                    </InputLabel>


                                    <Select
                                        value={
                                            selectedRoom
                                        }
                                        label="Room"
                                        onChange={(
                                            event
                                        ) =>
                                            setSelectedRoom(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                    >

                                        <MenuItem value="ALL">
                                            All Rooms
                                        </MenuItem>


                                        {ROOMS.map(
                                            (
                                                room
                                            ) => (

                                                <MenuItem
                                                    key={
                                                        room.id
                                                    }
                                                    value={
                                                        room.id
                                                    }
                                                >
                                                    {
                                                        room.name
                                                    }
                                                </MenuItem>

                                            )
                                        )}

                                    </Select>

                                </FormControl>

                            </Grid>


                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 8,
                                }}
                            >

                                <Box
                                    sx={{
                                        height:
                                            "100%",

                                        display:
                                            "flex",

                                        alignItems:
                                            "center",
                                    }}
                                >

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        Analysis is based on
                                        historical sensor
                                        records with live
                                        WebSocket readings
                                        incorporated as they
                                        arrive.
                                    </Typography>

                                </Box>

                            </Grid>

                        </Grid>

                    </CardContent>

                </Card>


                {/* ==================================================
                    LOADING
                ================================================== */}

                {loading ? (

                    <Box
                        sx={{
                            display:
                                "flex",

                            justifyContent:
                                "center",

                            py: 8,
                        }}
                    >

                        <CircularProgress />

                    </Box>

                ) : (

                    <>

                        {/* ==========================================
                            LIVE ENVIRONMENTAL PULSE
                        ========================================== */}

                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{
                                mb: 0.5,
                            }}
                        >
                            Live Environmental Pulse
                        </Typography>


                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mb: 2,
                            }}
                        >
                            Live room conditions represented
                            without a time-series line chart
                        </Typography>


                        <Grid
                            container
                            spacing={2}
                            sx={{
                                mb: 4,
                            }}
                        >

                            {/* TEMPERATURE */}

                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 3,
                                }}
                            >

                                <CircularPulseGauge
                                    title="Temperature"
                                    value={
                                        livePulseData.temperature
                                    }
                                    unit="°C"
                                    maxValue={50}
                                    color="#1976d2"
                                    subtitle={
                                        selectedRoom ===
                                            "ALL"
                                            ? "Building average"
                                            : "Current room"
                                    }
                                />

                            </Grid>


                            {/* HUMIDITY */}

                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 3,
                                }}
                            >

                                <CircularPulseGauge
                                    title="Humidity"
                                    value={
                                        livePulseData.humidity
                                    }
                                    unit="%"
                                    maxValue={100}
                                    color="#7b1fa2"
                                    subtitle={
                                        selectedRoom ===
                                            "ALL"
                                            ? "Building average"
                                            : "Current room"
                                    }
                                />

                            </Grid>


                            {/* GAS */}

                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 3,
                                }}
                            >

                                <GasPulseMeter
                                    value={
                                        livePulseData.gas
                                    }
                                />

                            </Grid>


                            {/* OCCUPANCY */}

                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 3,
                                }}
                            >

                                <OccupancyPulse
                                    occupied={
                                        livePulseData.occupied
                                    }
                                    totalRooms={
                                        ROOMS.length
                                    }
                                    selectedRoom={
                                        selectedRoom
                                    }
                                    motionDetected={
                                        livePulseData.motionDetected
                                    }
                                />

                            </Grid>

                        </Grid>


                        {/* ==========================================
                            ENVIRONMENTAL ANALYSIS
                        ========================================== */}

                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{
                                mb: 0.5,
                            }}
                        >
                            Environmental Analysis
                        </Typography>


                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mb: 2,
                            }}
                        >
                            Moving environmental trends across all monitored rooms.
                        </Typography>


                        <Grid
                            container
                            spacing={2}
                            sx={{
                                mb: 4,
                            }}
                        >

                            <Grid
                                size={{
                                    xs: 12,
                                }}
                            >

                                <SectionCard
                                    title="Temperature Trend"
                                    subtitle={
                                        selectedRoom === "ALL"
                                            ? "Building-average temperature movement over time."
                                            : `${roomName(selectedRoom)} temperature movement over time.`
                                    }>

                                    <Box
                                        sx={{
                                            width: "100%",
                                            height: 300,
                                        }}
                                    >

                                        <ResponsiveContainer>

                                            <LineChart
                                                data={environmentalTrendData}
                                            >

                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                />

                                                <XAxis
                                                    dataKey="timestamp"
                                                    tickFormatter={formatTime}
                                                />

                                                <YAxis
                                                    domain={["dataMin - 1", "dataMax + 1"]}
                                                    allowDataOverflow={false}
                                                />

                                                <Tooltip
                                                    labelFormatter={formatTime}
                                                />

                                                <Line
                                                    type="monotone"
                                                    dataKey="temperature"
                                                    name={
                                                        selectedRoom === "ALL"
                                                            ? "Building Average"
                                                            : roomName(selectedRoom)
                                                    }
                                                    stroke="#1976d2"
                                                    strokeWidth={2.5}
                                                    dot={false}
                                                    activeDot={{ r: 5 }}
                                                    connectNulls
                                                />

                                            </LineChart>

                                        </ResponsiveContainer>

                                    </Box>

                                </SectionCard>

                            </Grid>


                            <Grid
                                size={{
                                    xs: 12,
                                }}
                            >

                                <SectionCard
                                    title="Humidity Trend"
                                    subtitle={
                                        selectedRoom === "ALL"
                                            ? "Building-average humidity movement over time."
                                            : `${roomName(selectedRoom)} humidity movement over time.`
                                    }>

                                    <Box
                                        sx={{
                                            width: "100%",
                                            height: 300,
                                        }}
                                    >

                                        <ResponsiveContainer>

                                            <LineChart
                                                data={environmentalTrendData}
                                            >

                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                />

                                                <XAxis
                                                    dataKey="timestamp"
                                                    tickFormatter={formatTime}
                                                />

                                                <YAxis
                                                    domain={["dataMin - 2", "dataMax + 2"]}
                                                    allowDataOverflow={false}
                                                />

                                                <Tooltip
                                                    labelFormatter={formatTime}
                                                />

                                                <Line
                                                    type="monotone"
                                                    dataKey="humidity"
                                                    name={
                                                        selectedRoom === "ALL"
                                                            ? "Building Average"
                                                            : roomName(selectedRoom)
                                                    }
                                                    stroke="#7b1fa2"
                                                    strokeWidth={2.5}
                                                    dot={false}
                                                    activeDot={{ r: 5 }}
                                                    connectNulls
                                                />

                                            </LineChart>

                                        </ResponsiveContainer>

                                    </Box>

                                </SectionCard>

                            </Grid>


                            <Grid
                                size={{
                                    xs: 12,
                                }}
                            >

                                <SectionCard
                                    title="Gas Level Trend"
                                    subtitle={`${selectedRoom === "ALL"
                                            ? "Building-average"
                                            : roomName(selectedRoom)
                                        } MQ-2 raw ADC reading movement over time • Warning: ${GAS_WARNING_THRESHOLD} • Critical: ${GAS_CRITICAL_THRESHOLD}`}
                                >

                                    <Box
                                        sx={{
                                            width: "100%",
                                            height: 320,
                                        }}
                                    >

                                        <ResponsiveContainer>

                                            <LineChart
                                                data={environmentalTrendData}
                                            >

                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                />

                                                <XAxis
                                                    dataKey="timestamp"
                                                    tickFormatter={formatTime}
                                                />

                                                <YAxis />

                                                <Tooltip
                                                    labelFormatter={formatTime}
                                                />

                                                <Line
                                                    type="monotone"
                                                    dataKey="gas_level"
                                                    name={
                                                        selectedRoom === "ALL"
                                                            ? "Building Average"
                                                            : roomName(selectedRoom)
                                                    }
                                                    stroke="#ed6c02"
                                                    strokeWidth={2.5}
                                                    dot={false}
                                                    activeDot={{ r: 5 }}
                                                    connectNulls
                                                />

                                            </LineChart>

                                        </ResponsiveContainer>

                                    </Box>

                                </SectionCard>

                            </Grid>

                        </Grid>


                        {/* ==========================================
                            RISK & THRESHOLD ANALYSIS
                        ========================================== */}

                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{
                                mb: 2,
                            }}
                        >
                            Risk & Threshold Analysis
                        </Typography>


                        <Grid
                            container
                            spacing={2}
                            sx={{
                                mb: 4,
                            }}
                        >

                            {/* RISK */}

                            <Grid
                                size={{
                                    xs: 12,
                                    md: 7,
                                }}
                            >

                                <SectionCard
                                    title="Risk Score by Room"
                                    subtitle="Calculated from environmental conditions and occupancy"
                                >

                                    <Box
                                        sx={{
                                            width:
                                                "100%",

                                            height:
                                                300,
                                        }}
                                    >

                                        <ResponsiveContainer>

                                            <BarChart
                                                data={
                                                    riskData
                                                }
                                                layout="vertical"
                                                margin={{
                                                    left: 20,
                                                    right: 20,
                                                }}
                                            >

                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                />

                                                <XAxis
                                                    type="number"
                                                    domain={[
                                                        0,
                                                        100,
                                                    ]}
                                                />

                                                <YAxis
                                                    type="category"
                                                    dataKey="room"
                                                    width={110}
                                                />

                                                <Tooltip />

                                                <Bar
                                                    dataKey="risk"
                                                    name="Risk Score"
                                                    fill="#ed6c02"
                                                    radius={[
                                                        0,
                                                        4,
                                                        4,
                                                        0,
                                                    ]}
                                                />

                                            </BarChart>

                                        </ResponsiveContainer>

                                    </Box>

                                </SectionCard>

                            </Grid>


                            {/* STATUS */}

                            <Grid
                                size={{
                                    xs: 12,
                                    md: 5,
                                }}
                            >

                                <SectionCard
                                    title="Environmental Status"
                                    subtitle="Current room condition classification"
                                >

                                    <Stack
                                        spacing={2}
                                    >

                                        {ROOMS.map(
                                            (
                                                room
                                            ) => {

                                                const data =
                                                    currentByRoom[
                                                    room.id
                                                    ];


                                                const status =
                                                    calculateStatus(
                                                        data
                                                    );


                                                return (

                                                    <Box
                                                        key={
                                                            room.id
                                                        }
                                                        sx={{
                                                            display:
                                                                "flex",

                                                            alignItems:
                                                                "center",

                                                            justifyContent:
                                                                "space-between",

                                                            p:
                                                                1.5,

                                                            border:
                                                                "1px solid",

                                                            borderColor:
                                                                "divider",

                                                            borderRadius:
                                                                2,
                                                        }}
                                                    >

                                                        <Typography
                                                            fontWeight={
                                                                600
                                                            }
                                                        >
                                                            {
                                                                room.name
                                                            }
                                                        </Typography>


                                                        <Chip
                                                            label={
                                                                status
                                                            }
                                                            color={statusColor(
                                                                status
                                                            )}
                                                            size="small"
                                                        />

                                                    </Box>

                                                );

                                            }
                                        )}

                                    </Stack>

                                </SectionCard>

                            </Grid>

                        </Grid>


                        {/* ==========================================
                            OCCUPANCY ANALYSIS
                        ========================================== */}

                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{
                                mb: 2,
                            }}
                        >
                            Occupancy Analysis
                        </Typography>


                        <Grid
                            container
                            spacing={2}
                            sx={{
                                mb: 4,
                            }}
                        >

                            {/* PIE */}

                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6,
                                }}
                            >

                                <SectionCard
                                    title="Occupancy Distribution"
                                    subtitle="Current PIR-based room occupancy"
                                >

                                    <Box
                                        sx={{
                                            width:
                                                "100%",

                                            height:
                                                320,
                                        }}
                                    >

                                        <ResponsiveContainer>

                                            <PieChart>

                                                <Pie
                                                    data={
                                                        occupancyData
                                                    }
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={
                                                        100
                                                    }
                                                    label
                                                >

                                                    {occupancyData.map(
                                                        (
                                                            entry,
                                                            index
                                                        ) => (

                                                            <Cell
                                                                key={
                                                                    entry.name
                                                                }
                                                                fill={
                                                                    index ===
                                                                        0
                                                                        ? "#2e7d32"
                                                                        : "#9e9e9e"
                                                                }
                                                            />

                                                        )
                                                    )}

                                                </Pie>


                                                <Tooltip />

                                                <Legend />

                                            </PieChart>

                                        </ResponsiveContainer>

                                    </Box>

                                </SectionCard>

                            </Grid>


                            {/* HEALTH */}

                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6,
                                }}
                            >

                                <SectionCard
                                    title="Building Health"
                                    subtitle="Maximum current room risk"
                                >

                                    <Box
                                        sx={{
                                            width:
                                                "100%",

                                            height:
                                                320,

                                            position:
                                                "relative",
                                        }}
                                    >

                                        <ResponsiveContainer>

                                            <RadialBarChart
                                                innerRadius="65%"
                                                outerRadius="100%"
                                                startAngle={
                                                    90
                                                }
                                                endAngle={
                                                    -270
                                                }
                                                data={
                                                    buildingHealth
                                                }
                                            >

                                                <RadialBar
                                                    dataKey="value"
                                                    background
                                                    cornerRadius={
                                                        10
                                                    }
                                                />


                                                <PolarAngleAxis
                                                    type="number"
                                                    domain={[
                                                        0,
                                                        100,
                                                    ]}
                                                    tick={
                                                        false
                                                    }
                                                />

                                            </RadialBarChart>

                                        </ResponsiveContainer>


                                        <Box
                                            sx={{
                                                position:
                                                    "absolute",

                                                top:
                                                    "50%",

                                                left:
                                                    "50%",

                                                transform:
                                                    "translate(-50%, -50%)",

                                                textAlign:
                                                    "center",
                                            }}
                                        >

                                            <Typography
                                                variant="h3"
                                                fontWeight={
                                                    700
                                                }
                                            >
                                                {
                                                    buildingMetrics.maximumRisk
                                                }
                                            </Typography>


                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                Max Risk
                                            </Typography>

                                        </Box>

                                    </Box>

                                </SectionCard>

                            </Grid>

                        </Grid>


                        {/* ==========================================
                            SELECTED ROOM ANALYTICS
                        ========================================== */}

                        {selectedRoom !==
                            "ALL" && (

                                <>

                                    <Typography
                                        variant="h6"
                                        fontWeight={
                                            700
                                        }
                                        sx={{
                                            mb: 2,
                                        }}
                                    >
                                        Selected Room Analytics
                                    </Typography>


                                    <SectionCard
                                        title={`${roomName(
                                            selectedRoom
                                        )} Analysis`}
                                        subtitle="Historical statistics and current room state"
                                        sx={{
                                            mb: 4,
                                        }}
                                    >

                                        {/* STATISTICS */}

                                        <Grid
                                            container
                                            spacing={2}
                                            sx={{
                                                mb: 3,
                                            }}
                                        >

                                            <Grid
                                                size={{
                                                    xs: 12,
                                                    sm: 6,
                                                    md: 3,
                                                }}
                                            >

                                                <MetricCard
                                                    title="Average Temperature"
                                                    value={formatNumber(
                                                        selectedRoomStats?.averageTemperature
                                                    )}
                                                    unit="°C"
                                                />

                                            </Grid>


                                            <Grid
                                                size={{
                                                    xs: 12,
                                                    sm: 6,
                                                    md: 3,
                                                }}
                                            >

                                                <MetricCard
                                                    title="Temperature Range"
                                                    value={`${formatNumber(
                                                        selectedRoomStats?.minimumTemperature
                                                    )} – ${formatNumber(
                                                        selectedRoomStats?.maximumTemperature
                                                    )}`}
                                                    unit="°C"
                                                />

                                            </Grid>


                                            <Grid
                                                size={{
                                                    xs: 12,
                                                    sm: 6,
                                                    md: 3,
                                                }}
                                            >

                                                <MetricCard
                                                    title="Average Humidity"
                                                    value={formatNumber(
                                                        selectedRoomStats?.averageHumidity
                                                    )}
                                                    unit="%"
                                                />

                                            </Grid>


                                            <Grid
                                                size={{
                                                    xs: 12,
                                                    sm: 6,
                                                    md: 3,
                                                }}
                                            >

                                                <MetricCard
                                                    title="Average Gas"
                                                    value={formatNumber(
                                                        selectedRoomStats?.averageGas,
                                                        0
                                                    )}
                                                    unit="ADC"
                                                />

                                            </Grid>

                                        </Grid>


                                        <Divider
                                            sx={{
                                                mb: 3,
                                            }}
                                        />


                                        {/* CURRENT STATE */}

                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={
                                                700
                                            }
                                            sx={{
                                                mb: 2,
                                            }}
                                        >
                                            Current Room State
                                        </Typography>


                                        <Grid
                                            container
                                            spacing={2}
                                            sx={{
                                                mb: 3,
                                            }}
                                        >

                                            <Grid
                                                size={{
                                                    xs: 6,
                                                    md: 2,
                                                }}
                                            >

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Temperature
                                                </Typography>


                                                <Typography
                                                    variant="h6"
                                                    fontWeight={
                                                        700
                                                    }
                                                >
                                                    {formatNumber(
                                                        latestSelectedRoom?.temperature
                                                    )}
                                                    °C
                                                </Typography>

                                            </Grid>


                                            <Grid
                                                size={{
                                                    xs: 6,
                                                    md: 2,
                                                }}
                                            >

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Humidity
                                                </Typography>


                                                <Typography
                                                    variant="h6"
                                                    fontWeight={
                                                        700
                                                    }
                                                >
                                                    {formatNumber(
                                                        latestSelectedRoom?.humidity
                                                    )}
                                                    %
                                                </Typography>

                                            </Grid>


                                            <Grid
                                                size={{
                                                    xs: 6,
                                                    md: 2,
                                                }}
                                            >

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Gas
                                                </Typography>


                                                <Typography
                                                    variant="h6"
                                                    fontWeight={
                                                        700
                                                    }
                                                >
                                                    {formatNumber(
                                                        latestSelectedRoom?.gas_level,
                                                        0
                                                    )}
                                                </Typography>

                                            </Grid>


                                            <Grid
                                                size={{
                                                    xs: 6,
                                                    md: 2,
                                                }}
                                            >

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Occupancy
                                                </Typography>


                                                <Typography
                                                    variant="h6"
                                                    fontWeight={
                                                        700
                                                    }
                                                >
                                                    {
                                                        latestSelectedRoom?.motion_detected
                                                            ? "Occupied"
                                                            : "Vacant"
                                                    }
                                                </Typography>

                                            </Grid>


                                            <Grid
                                                size={{
                                                    xs: 6,
                                                    md: 2,
                                                }}
                                            >

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Status
                                                </Typography>


                                                <Box>

                                                    <Chip
                                                        label={calculateStatus(
                                                            latestSelectedRoom
                                                        )}
                                                        color={statusColor(
                                                            calculateStatus(
                                                                latestSelectedRoom
                                                            )
                                                        )}
                                                        size="small"
                                                    />

                                                </Box>

                                            </Grid>


                                            <Grid
                                                size={{
                                                    xs: 6,
                                                    md: 2,
                                                }}
                                            >

                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                >
                                                    Data Source
                                                </Typography>


                                                <Typography
                                                    variant="body2"
                                                    fontWeight={
                                                        600
                                                    }
                                                >
                                                    Live / Historical
                                                </Typography>

                                            </Grid>

                                        </Grid>


                                        {/* RECENT SENSOR DATA */}

                                        <Typography
                                            variant="subtitle1"
                                            fontWeight={
                                                700
                                            }
                                            sx={{
                                                mb: 2,
                                            }}
                                        >
                                            Recent Sensor Analysis
                                        </Typography>


                                        {recentSelectedData.length >
                                            0 ? (

                                            <Box
                                                sx={{
                                                    width:
                                                        "100%",

                                                    height:
                                                        320,
                                                }}
                                            >

                                                <ResponsiveContainer>

                                                    <BarChart
                                                        data={
                                                            recentSelectedData
                                                        }
                                                    >

                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                        />


                                                        <XAxis
                                                            dataKey="index"
                                                            label={{
                                                                value:
                                                                    "Recent Reading",
                                                                position:
                                                                    "insideBottom",
                                                                offset:
                                                                    -5,
                                                            }}
                                                        />


                                                        <YAxis />


                                                        <Tooltip />


                                                        <Legend />


                                                        <Bar
                                                            dataKey="temperature"
                                                            name="Temperature °C"
                                                            fill="#1976d2"
                                                        />


                                                        <Bar
                                                            dataKey="humidity"
                                                            name="Humidity %"
                                                            fill="#7b1fa2"
                                                        />

                                                    </BarChart>

                                                </ResponsiveContainer>

                                            </Box>

                                        ) : (

                                            <Alert
                                                severity="info"
                                            >
                                                No historical
                                                readings are
                                                available for this
                                                room.
                                            </Alert>

                                        )}

                                    </SectionCard>

                                </>

                            )}


                        {/* ==========================================
                            LIVE DATA ACTIVITY
                        ========================================== */}

                        <Typography
                            variant="h6"
                            fontWeight={700}
                            sx={{
                                mb: 2,
                            }}
                        >
                            Live Data Activity
                        </Typography>


                        <Card
                            sx={{
                                mb: 3,
                            }}
                        >

                            <CardContent>

                                <Grid
                                    container
                                    spacing={3}
                                >

                                    <Grid
                                        size={{
                                            xs: 12,
                                            sm: 6,
                                            md: 3,
                                        }}
                                    >

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            Connection
                                        </Typography>


                                        <Typography
                                            variant="h6"
                                            fontWeight={
                                                700
                                            }
                                        >
                                            {
                                                connectionStatus
                                            }
                                        </Typography>

                                    </Grid>


                                    <Grid
                                        size={{
                                            xs: 12,
                                            sm: 6,
                                            md: 3,
                                        }}
                                    >

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            Live Updates
                                        </Typography>


                                        <Typography
                                            variant="h6"
                                            fontWeight={
                                                700
                                            }
                                        >
                                            {
                                                liveUpdateCount
                                            }
                                        </Typography>

                                    </Grid>


                                    <Grid
                                        size={{
                                            xs: 12,
                                            sm: 6,
                                            md: 3,
                                        }}
                                    >

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            Last Updated Room
                                        </Typography>


                                        <Typography
                                            variant="h6"
                                            fontWeight={
                                                700
                                            }
                                        >
                                            {lastLiveRoom
                                                ? roomName(
                                                    lastLiveRoom
                                                )
                                                : "--"}
                                        </Typography>

                                    </Grid>


                                    <Grid
                                        size={{
                                            xs: 12,
                                            sm: 6,
                                            md: 3,
                                        }}
                                    >

                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            Last Update
                                        </Typography>


                                        <Typography
                                            variant="h6"
                                            fontWeight={
                                                700
                                            }
                                        >
                                            {formatTime(
                                                lastLiveUpdate
                                            )}
                                        </Typography>

                                    </Grid>

                                </Grid>

                            </CardContent>

                        </Card>


                        {/* ==========================================
                            DATA INFORMATION
                        ========================================== */}

                        <Card>

                            <CardContent>

                                <Typography
                                    variant="h6"
                                    fontWeight={700}
                                    sx={{
                                        mb: 1.5,
                                    }}
                                >
                                    Data Information
                                </Typography>


                                <Stack
                                    spacing={0.75}
                                >

                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        • Historical analytics
                                        use stored sensor
                                        records from the
                                        backend.
                                    </Typography>


                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        • Live readings are
                                        received through the
                                        WebSocket connection.
                                    </Typography>


                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        • Occupancy is based
                                        operationally on PIR
                                        sensor detection.
                                    </Typography>


                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        • MQ-2 gas values are
                                        raw ADC readings and
                                        are not calibrated
                                        ppm measurements.
                                    </Typography>

                                </Stack>

                            </CardContent>

                        </Card>

                    </>

                )}

            </Box>

        </Layout>
    );
}
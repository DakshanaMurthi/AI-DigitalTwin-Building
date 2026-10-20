import {
    Box,
    Card,
    CardContent,
    Chip,
    Stack,
    Typography,
} from "@mui/material";

function getTemperature(room) {
    return Number(
        room?.temperature ??
        room?.latest_sensor?.temperature ??
        0
    );
}

function getHumidity(room) {
    return Number(
        room?.humidity ??
        room?.latest_sensor?.humidity ??
        0
    );
}

function getGasLevel(room) {
    return Number(
        room?.gas_level ??
        room?.latest_sensor?.gas_level ??
        0
    );
}

function getMotion(room) {
    return Boolean(
        room?.motion_detected ??
        room?.latest_sensor?.motion_detected ??
        false
    );
}

function normalizeStatus(room) {
    const rawStatus =
        room?.status ??
        room?.ai_status ??
        room?.prediction_status ??
        "";

    const status = String(rawStatus).trim().toLowerCase();

    if (status === "critical") {
        return "Critical";
    }

    if (status === "warning") {
        return "Warning";
    }

    if (status === "normal") {
        return "Normal";
    }

    const gasLevel = getGasLevel(room);
    const temperature = getTemperature(room);
    const humidity = getHumidity(room);

    if (gasLevel >= 600) {
        return "Critical";
    }

    if (
        gasLevel >= 350 ||
        temperature >= 35 ||
        humidity >= 70
    ) {
        return "Warning";
    }

    return "Normal";
}

function getStatusColor(status) {
    if (status === "Critical") {
        return "#d32f2f";
    }

    if (status === "Warning") {
        return "#ed6c02";
    }

    return "#2e7d32";
}

function OfficeRoom({ room, onClick }) {
    const roomName =
        room?.room_name ||
        room?.name ||
        room?.room_id ||
        "Unknown Room";

    const temperature = getTemperature(room);
    const humidity = getHumidity(room);
    const gasLevel = getGasLevel(room);
    const motion = getMotion(room);

    const status = normalizeStatus(room);
    const statusColor = getStatusColor(status);

    return (
        <Card
            onClick={() => onClick?.(room)}
            elevation={3}
            sx={{
                height: "100%",
                minHeight: 205,
                cursor: onClick ? "pointer" : "default",
                borderRadius: 2,
                borderLeft: `6px solid ${statusColor}`,
                transition:
                    "transform 0.15s ease, box-shadow 0.15s ease",
                "&:hover": onClick
                    ? {
                        transform: "translateY(-2px)",
                        boxShadow: 6,
                    }
                    : undefined,
            }}
        >
            <CardContent>
                <Typography
                    variant="h6"
                    fontWeight={700}
                    sx={{
                        mb: 1.5,
                        color: "#0F172A",
                    }}
                >
                    {roomName}
                </Typography>

                <Stack spacing={1}>
                    <Typography variant="body2">
                        🌡 Temperature :{" "}
                        <b>{temperature} °C</b>
                    </Typography>

                    <Typography variant="body2">
                        💧 Humidity :{" "}
                        <b>{humidity} %</b>
                    </Typography>

                    <Typography variant="body2">
                        ☁ Gas Level :{" "}
                        <b>{gasLevel}</b>
                    </Typography>

                    <Typography variant="body2">
                        🚶 Motion :{" "}
                        <b>
                            {motion
                                ? "Detected"
                                : "Not Detected"}
                        </b>
                    </Typography>
                </Stack>

                <Box sx={{ mt: 2 }}>
                    <Chip
                        label={status}
                        size="small"
                        sx={{
                            backgroundColor: statusColor,
                            color: "#fff",
                            fontWeight: 700,
                        }}
                    />
                </Box>
            </CardContent>
        </Card>
    );
}

export default OfficeRoom;
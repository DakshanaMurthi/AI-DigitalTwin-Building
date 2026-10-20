import { Grid, Paper, Typography } from "@mui/material";

function FloorPlan({
    rooms,
    onRoomClick,
}) {
    const getRoomColor = (status) => {
        switch (status) {
            case "Critical":
                return "#f44336";

            case "Warning":
                return "#ff9800";

            case "Normal":
                return "#4caf50";

            default:
                return "#9e9e9e";
        }
    };

    return (
        <Paper
            elevation={4}
            sx={{
                mt: 4,
                p: 3,
                borderRadius: 3,
            }}
        >
            <Typography
                variant="h5"
                gutterBottom
            >
                Building Floor Plan
            </Typography>

            <Grid container spacing={2}>
                {rooms.map((room) => {
                    const color = getRoomColor(room.status);

                    return (
                        <Grid
                            key={room.room_id}
                            size={{ xs: 6, md: 3 }}
                        >
                            <Paper
                                elevation={3}
                                onClick={() => onRoomClick(room)}
                                sx={{
                                    p: 2,
                                    textAlign: "center",
                                    backgroundColor: color,
                                    color: "white",
                                    borderRadius: 3,
                                    cursor: "pointer",
                                    transition: "0.3s",

                                    "&:hover": {
                                        transform: "scale(1.05)",
                                        boxShadow: 8,
                                    },
                                }}
                            >
                                <Typography variant="h6">
                                    {room.room_name || room.room_id}
                                </Typography>

                                <Typography
                                    variant="caption"
                                    sx={{ opacity: 0.85 }}
                                >
                                    {room.building_id}
                                </Typography>

                                <Typography>
                                    🌡 {room.temperature} °C
                                </Typography>

                                <Typography>
                                    💧 {room.humidity} %
                                </Typography>

                                <Typography>
                                    {room.motion_detected
                                        ? "🚶 Motion"
                                        : "😴 Empty"}
                                </Typography>

                                <Typography
                                    variant="caption"
                                    sx={{
                                        display: "block",
                                        mt: 1,
                                        fontWeight: "bold",
                                    }}
                                >
                                    {room.status || "Unknown"}
                                </Typography>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </Paper>
    );
}

export default FloorPlan;
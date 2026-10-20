import {
    Box,
    Grid,
    Paper,
    Typography,
} from "@mui/material";

import OfficeRoom from "./OfficeRoom";

function OfficeMap({ rooms, onRoomClick }) {
    const safeRooms = Array.isArray(rooms) ? rooms : [];

    return (
        <Paper
            elevation={2}
            sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid #E2E8F0",
                height: "100%",
                minHeight: 350,
                boxSizing: "border-box",
                overflow: "hidden",
            }}
        >
            <Typography
                variant="h5"
                gutterBottom
                fontWeight={700}
                sx={{
                    color: "#0F172A",
                    mb: 2.5,
                }}
            >
                🏢 Office Digital Twin
            </Typography>

            {safeRooms.length === 0 ? (
                <Box
                    sx={{
                        minHeight: 250,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                    }}
                >
                    <Typography color="text.secondary">
                        No rooms available for the selected building.
                    </Typography>
                </Box>
            ) : (
                <Grid
                    container
                    spacing={2.5}
                >
                    {safeRooms.map((room) => (
                        <Grid
                            key={room.room_id}
                            size={{
                                xs: 12,
                                sm: 6,
                            }}
                        >
                            <OfficeRoom
                                room={room}
                                onClick={onRoomClick}
                            />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Paper>
    );
}

export default OfficeMap;
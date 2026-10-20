import {
    Paper,
    Typography,
    Box,
} from "@mui/material";

function BuildingMap({ rooms, onRoomClick }) {

    const getRoomColor = (room) => {

        if (room.gas_level > 500)
            return "#f44336";

        if (room.temperature > 30)
            return "#ff9800";

        return "#4caf50";
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
                🏢 Digital Twin Building
            </Typography>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2,1fr)",
                    gap: 3,
                }}
            >

                {rooms.map((room) => (

                    <Paper

                        key={room.room_id}

                        elevation={5}

                        onClick={() => onRoomClick(room)}

                        sx={{
                            height: 130,
                            backgroundColor: getRoomColor(room),
                            color: "white",
                            cursor: "pointer",

                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",

                            transition: "0.3s",

                            "&:hover": {
                                transform: "scale(1.05)",
                            },

                        }}

                    >

                        <Typography
                            variant="h6"
                            fontWeight="bold"
                        >
                            {room.room_id}
                        </Typography>

                        <Typography>
                            🌡 {room.temperature} °C
                        </Typography>

                        <Typography>
                            ☁ {room.gas_level}
                        </Typography>

                    </Paper>

                ))}

            </Box>

        </Paper>

    );

}

export default BuildingMap;
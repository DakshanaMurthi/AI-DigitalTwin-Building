import {
    Card,
    CardContent,
    Typography,
    Chip,
    Stack,
} from "@mui/material";

import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import Co2Icon from "@mui/icons-material/Co2";
import SensorsIcon from "@mui/icons-material/Sensors";

function RoomCard({ room }) {

    let borderColor = "#4caf50";
    let status = "Normal";

    if (room.gas_level > 500) {
        borderColor = "#f44336";
        status = "Danger";
    }
    else if (room.temperature > 30) {
        borderColor = "#ff9800";
        status = "Warning";
    }

    return (
        <Card
            elevation={5}
            sx={{
                borderRadius: 3,
                borderLeft: `10px solid ${borderColor}`,
                transition: "0.3s",
                "&:hover": {
                    transform: "scale(1.03)",
                },
            }}
        >
            <CardContent>

                <Typography
                    variant="h6"
                    fontWeight="bold"
                >
                    {room.room_id}
                </Typography>

                <Stack spacing={1} mt={2}>

                    <Typography>
                        <DeviceThermostatIcon fontSize="small" />
                        {" "}
                        {room.temperature} °C
                    </Typography>

                    <Typography>
                        <WaterDropIcon fontSize="small" />
                        {" "}
                        {room.humidity} %
                    </Typography>

                    <Typography>
                        <Co2Icon fontSize="small" />
                        {" "}
                        {room.gas_level}
                    </Typography>

                    <Typography>
                        <SensorsIcon fontSize="small" />
                        {" "}
                        {room.motion_detected ? "Motion Detected" : "No Motion"}
                    </Typography>

                    <Chip
                        label={status}
                        color={
                            status === "Danger"
                                ? "error"
                                : status === "Warning"
                                    ? "warning"
                                    : "success"
                        }
                    />

                </Stack>

            </CardContent>
        </Card>
    );
}

export default RoomCard;
import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    MenuItem,
    Select,
    Snackbar,
    TextField,
    Typography,
} from "@mui/material";

import api from "../api/api";

function GasSimulator({ rooms = [], onSimulationComplete }) {
    const [roomId, setRoomId] = useState(
        rooms.length > 0 ? rooms[0].room_id : "MANAGER_CABIN"
    );

    const [gasLevel, setGasLevel] = useState(320);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const simulateGas = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.post("/gas/simulate", {
                room_id: roomId,
                gas_level: Number(gasLevel),
            });

            const simulationResult = response.data.data;

            setResult(simulationResult);

            if (onSimulationComplete) {
                onSimulationComplete(simulationResult);
            }
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to simulate gas reading."
            );
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        if (status === "Critical") return "error";
        if (status === "Warning") return "warning";
        return "success";
    };

    return (
        <>
            <Card
                elevation={5}
                sx={{
                    borderRadius: 4,
                    height: "100%",
                }}
            >
                <CardContent>
                    <Typography
                        variant="h6"
                        fontWeight="bold"
                        gutterBottom
                    >
                        Gas Sensor Simulation
                    </Typography>

                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 3 }}
                    >
                        Simulate gas sensor values and observe room safety
                        alerts.
                    </Typography>

                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                        }}
                    >
                        <Select
                            value={roomId}
                            onChange={(event) =>
                                setRoomId(event.target.value)
                            }
                            fullWidth
                            size="small"
                        >
                            {rooms.length > 0 ? (
                                rooms.map((room) => (
                                    <MenuItem
                                        key={room.room_id}
                                        value={room.room_id}
                                    >
                                        {room.room_name || room.room_id}
                                    </MenuItem>
                                ))
                            ) : (
                                <MenuItem value="MANAGER_CABIN">
                                    Manager Cabin
                                </MenuItem>
                            )}
                        </Select>

                        <TextField
                            label="Gas Level"
                            type="number"
                            value={gasLevel}
                            onChange={(event) =>
                                setGasLevel(event.target.value)
                            }
                            inputProps={{ min: 0 }}
                            fullWidth
                            size="small"
                        />

                        <Typography
                            variant="caption"
                            color="text.secondary"
                        >
                            Normal: below 350 | Warning: 350–599 |
                            Critical: 600 and above
                        </Typography>

                        <Button
                            variant="contained"
                            onClick={simulateGas}
                            disabled={loading || gasLevel === ""}
                            fullWidth
                        >
                            {loading
                                ? "Simulating..."
                                : "Simulate Gas Reading"}
                        </Button>

                        {result && (
                            <Alert
                                severity={getStatusColor(result.status)}
                                sx={{ mt: 1 }}
                            >
                                <Typography fontWeight="bold">
                                    {result.status} Gas Level
                                </Typography>

                                <Typography variant="body2">
                                    Room: {result.room_id}
                                </Typography>

                                <Typography variant="body2">
                                    Gas Level: {result.gas_level}
                                </Typography>

                                <Typography variant="body2">
                                    Risk Score: {result.risk_score}
                                </Typography>

                                {result.reasons?.length > 0 && (
                                    <Typography variant="body2">
                                        Reason: {result.reasons.join(", ")}
                                    </Typography>
                                )}
                            </Alert>
                        )}
                    </Box>
                </CardContent>
            </Card>

            <Snackbar
                open={Boolean(error)}
                autoHideDuration={5000}
                onClose={() => setError("")}
            >
                <Alert
                    severity="error"
                    onClose={() => setError("")}
                >
                    {error}
                </Alert>
            </Snackbar>
        </>
    );
}

export default GasSimulator;
import { useEffect, useState } from "react";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Button,
    Divider,
    Chip,
    Stack,
    CircularProgress,
    Alert,
} from "@mui/material";

import { getRoomPrediction } from "../api/api";


function normalizePrediction(data) {
    return {
        prediction:
            data?.prediction ?? null,

        confidence:
            data?.confidence !== null &&
                data?.confidence !== undefined
                ? Number(data.confidence)
                : null,

        riskScore:
            data?.risk_score !== null &&
                data?.risk_score !== undefined
                ? Number(data.risk_score)
                : 0,

        status:
            data?.status ?? "Normal",

        reasons:
            Array.isArray(data?.reasons)
                ? data.reasons
                : [],

        action:
            data?.suggested_action ??
            data?.action ??
            null,
    };
}


function RoomDialog({
    open,
    onClose,
    room,
}) {
    const [prediction, setPrediction] =
        useState(null);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    useEffect(() => {
        let cancelled = false;

        if (
            !open ||
            !room?.room_id
        ) {
            return () => {
                cancelled = true;
            };
        }


        const fetchPrediction =
            async () => {
                try {
                    setLoading(true);
                    setError("");
                    setPrediction(null);


                    const response =
                        await getRoomPrediction(
                            room.room_id
                        );


                    console.log(
                        "Room:",
                        room.room_id
                    );

                    console.log(
                        "Prediction data:",
                        response
                    );


                    const normalized =
                        normalizePrediction(
                            response
                        );


                    console.log(
                        "Normalized prediction:",
                        normalized
                    );


                    if (!cancelled) {
                        setPrediction(
                            normalized
                        );
                    }

                } catch (err) {
                    console.error(
                        "Prediction fetch error:",
                        err
                    );


                    if (!cancelled) {
                        setError(
                            err?.response?.data
                                ?.detail ||
                            err?.message ||
                            "Unable to fetch AI prediction."
                        );
                    }

                } finally {
                    if (!cancelled) {
                        setLoading(false);
                    }
                }
            };


        fetchPrediction();


        return () => {
            cancelled = true;
        };

    }, [
        open,
        room?.room_id,
    ]);


    if (!room) {
        return null;
    }


    const status =
        prediction
            ? {
                label:
                    prediction.status,

                color:
                    prediction.status ===
                        "Critical"
                        ? "error"
                        : prediction.status ===
                            "Warning"
                            ? "warning"
                            : "success",
            }
            : {
                label: "Loading",
                color: "default",
            };


    const suggestedAction =
        prediction?.action ||
        (
            prediction?.status ===
                "Critical"
                ? "Evacuate room immediately and inspect the gas source."

                : prediction?.status ===
                    "Warning"
                    ? "Check the room conditions and consider switching ON cooling."

                    : "Everything is operating normally."
        );


    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >

            <DialogTitle>
                {room.room_name ||
                    room.room_id}
            </DialogTitle>


            <DialogContent>

                {/* Status and Risk */}
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{ mb: 2 }}
                >

                    <Chip
                        label={status.label}
                        color={status.color}
                    />


                    {prediction && (
                        <Chip
                            label={`Risk Score: ${prediction.riskScore}/100`}
                            color={
                                prediction.riskScore >= 50
                                    ? "error"
                                    : prediction.riskScore > 0
                                        ? "warning"
                                        : "success"
                            }
                            variant="outlined"
                        />
                    )}

                </Stack>


                {/* Current Sensor Values */}
                <Typography>
                    🌡 Temperature :{" "}
                    <b>
                        {room.temperature ?? "—"} °C
                    </b>
                </Typography>


                <Typography>
                    💧 Humidity :{" "}
                    <b>
                        {room.humidity ?? "—"} %
                    </b>
                </Typography>


                <Typography>
                    ☁ Gas Level :{" "}
                    <b>
                        {room.gas_level ?? "—"}
                    </b>
                </Typography>


                <Typography>
                    🚶 Motion :{" "}
                    <b>
                        {room.motion_detected
                            ? "Detected"
                            : "Not Detected"}
                    </b>
                </Typography>


                <Divider
                    sx={{ my: 2 }}
                />


                {/* AI Prediction */}
                <Typography
                    variant="h6"
                    sx={{ mb: 1 }}
                >
                    AI Prediction
                </Typography>


                {loading && (
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 1 }}
                    >

                        <CircularProgress
                            size={20}
                        />

                        <Typography>
                            Analyzing room data...
                        </Typography>

                    </Stack>
                )}


                {error && (
                    <Alert
                        severity="error"
                        sx={{ mt: 1 }}
                    >
                        {error}
                    </Alert>
                )}


                {prediction && !loading && (
                    <>

                        <Typography>
                            Occupancy :{" "}
                            <b>
                                {prediction.prediction ??
                                    "—"}
                            </b>
                        </Typography>


                        <Typography>
                            Confidence :{" "}
                            <b>
                                {prediction.confidence !==
                                    null &&
                                    prediction.confidence !==
                                    undefined
                                    ? `${prediction.confidence}%`
                                    : "—"}
                            </b>
                        </Typography>


                        <Typography>
                            Risk Score :{" "}
                            <b>
                                {prediction.riskScore}/100
                            </b>
                        </Typography>


                        {prediction.reasons.length >
                            0 && (
                                <Typography
                                    sx={{ mt: 1 }}
                                >
                                    Reason :{" "}
                                    <b>
                                        {prediction.reasons.join(
                                            ", "
                                        )}
                                    </b>
                                </Typography>
                            )}

                    </>
                )}


                <Divider
                    sx={{ my: 2 }}
                />


                {/* Suggested Action */}
                <Typography
                    variant="h6"
                    sx={{ mb: 1 }}
                >
                    Suggested Action
                </Typography>


                <Typography>
                    {suggestedAction}
                </Typography>

            </DialogContent>


            <DialogActions>

                <Button
                    variant="contained"
                    onClick={onClose}
                >
                    Close
                </Button>

            </DialogActions>

        </Dialog>
    );
}


export default RoomDialog;
import { useCallback, useEffect, useState } from "react";

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    Snackbar,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";

import Layout from "../components/Layout";

import { useBuilding } from "../contexts/useBuilding";

import {
    getBuilding,
    updateBuilding,
} from "../api/buildingApi";


/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SETTINGS = {
    temperatureWarning: 35,
    gasWarning: 350,
    gasCritical: 600,
    humidityWarning: 70,

    gasAlerts: true,
    temperatureAlerts: true,
    motionAlerts: true,
    browserNotifications: false,

    automaticRefresh: true,
    websocketUpdates: true,
    refreshInterval: 10,
};


/* =========================================================
   SETTINGS STORAGE
========================================================= */

const SETTINGS_STORAGE_KEY =
    "ai-digital-twin-settings";


function loadLocalSettings() {
    try {
        const saved =
            localStorage.getItem(
                SETTINGS_STORAGE_KEY
            );

        if (!saved) {
            return DEFAULT_SETTINGS;
        }

        return {
            ...DEFAULT_SETTINGS,
            ...JSON.parse(saved),
        };
    } catch (error) {
        console.error(
            "Unable to load settings:",
            error
        );

        return DEFAULT_SETTINGS;
    }
}


/* =========================================================
   SETTINGS PAGE
========================================================= */

function Settings() {

    const {
        selectedBuildingId,
    } = useBuilding();


    /* =====================================================
       BUILDING
    ===================================================== */

    const [building, setBuilding] =
        useState(null);

    const [buildingForm, setBuildingForm] =
        useState({
            building_name: "",
            location: "",
            total_floors: "",
            description: "",
        });


    /* =====================================================
       MONITORING SETTINGS
    ===================================================== */

    const [settings, setSettings] =
        useState(loadLocalSettings);


    /* =====================================================
       UI STATE
    ===================================================== */

    const [loading, setLoading] =
        useState(false);

    const [savingBuilding, setSavingBuilding] =
        useState(false);

    const [savingSettings, setSavingSettings] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    /* =====================================================
       LOAD BUILDING
    ===================================================== */

    const loadBuilding =
        useCallback(async () => {

            if (!selectedBuildingId) {
                setBuilding(null);

                setBuildingForm({
                    building_name: "",
                    location: "",
                    total_floors: "",
                    description: "",
                });

                return;
            }

            try {

                setLoading(true);
                setError("");

                console.log(
                    "Loading building:",
                    selectedBuildingId
                );

                const data =
                    await getBuilding(
                        selectedBuildingId
                    );

                console.log(
                    "Building data:",
                    data
                );

                setBuilding(data);

                setBuildingForm({
                    building_name:
                        data?.building_name ??
                        data?.name ??
                        "",

                    location:
                        data?.location ??
                        "",

                    total_floors:
                        data?.total_floors ??
                        data?.floors ??
                        "",

                    description:
                        data?.description ??
                        "",
                });

            } catch (err) {

                console.error(
                    "Building loading error:",
                    err
                );

                setBuilding(null);

                setError(
                    err?.response?.data?.detail ||
                    "Unable to load building configuration."
                );

            } finally {

                setLoading(false);

            }

        }, [
            selectedBuildingId,
        ]);


    useEffect(() => {

        loadBuilding();

    }, [
        loadBuilding,
    ]);


    /* =====================================================
       BUILDING INPUT
    ===================================================== */

    const handleBuildingChange =
        (event) => {

            const {
                name,
                value,
            } = event.target;

            setBuildingForm(
                (previous) => ({
                    ...previous,
                    [name]: value,
                })
            );

        };


    /* =====================================================
       SAVE BUILDING
    ===================================================== */

    const handleSaveBuilding =
        async () => {

            if (!selectedBuildingId) {
                setError(
                    "Please select a building first."
                );

                return;
            }

            try {

                setSavingBuilding(true);
                setError("");

                const payload = {
                    building_name:
                        buildingForm.building_name,

                    location:
                        buildingForm.location,

                    total_floors:
                        Number(
                            buildingForm.total_floors
                        ),

                    description:
                        buildingForm.description,
                };

                console.log(
                    "Updating building:",
                    payload
                );

                const updated =
                    await updateBuilding(
                        selectedBuildingId,
                        payload
                    );

                setBuilding(
                    updated
                );

                setSuccess(
                    "Building configuration saved successfully."
                );

            } catch (err) {

                console.error(
                    "Building update error:",
                    err
                );

                setError(
                    err?.response?.data?.detail ||
                    "Unable to save building configuration."
                );

            } finally {

                setSavingBuilding(false);

            }

        };


    /* =====================================================
       MONITORING SETTING CHANGE
    ===================================================== */

    const handleSettingChange =
        (name, value) => {

            setSettings(
                (previous) => ({
                    ...previous,
                    [name]: value,
                })
            );

        };


    /* =====================================================
       SAVE MONITORING SETTINGS
    ===================================================== */

    const handleSaveSettings =
        () => {

            try {

                setSavingSettings(true);

                localStorage.setItem(
                    SETTINGS_STORAGE_KEY,
                    JSON.stringify(settings)
                );

                setSuccess(
                    "Monitoring preferences saved for this browser."
                );

            } catch (err) {

                console.error(
                    "Settings save error:",
                    err
                );

                setError(
                    "Unable to save monitoring preferences."
                );

            } finally {

                setSavingSettings(false);

            }

        };


    /* =====================================================
       BROWSER NOTIFICATIONS
    ===================================================== */

    const handleBrowserNotification =
        async (enabled) => {

            if (
                enabled &&
                "Notification" in window
            ) {

                const permission =
                    await Notification.requestPermission();

                if (
                    permission !==
                    "granted"
                ) {

                    setSuccess(
                        "Browser notification permission was not granted."
                    );

                    return;
                }

            }

            handleSettingChange(
                "browserNotifications",
                enabled
            );

        };


    /* =====================================================
       STATUS
    ===================================================== */

    const backendStatus =
        selectedBuildingId &&
            building
            ? "Connected"
            : "Not Connected";


    return (

        <Layout>

            <Box
                sx={{
                    width: "100%",
                    maxWidth: 1200,
                    mx: "auto",
                }}
            >

                {/* =================================================
                    HEADER
                ================================================= */}

                <Box sx={{ mb: 4 }}>

                    <Typography
                        variant="h4"
                        fontWeight={800}
                        sx={{
                            color: "#0F172A",
                        }}
                    >
                        Settings
                    </Typography>

                    <Typography
                        color="text.secondary"
                        sx={{ mt: 0.75 }}
                    >
                        Configure building information,
                        monitoring thresholds and dashboard
                        preferences.
                    </Typography>

                </Box>


                {/* =================================================
                    ERROR
                ================================================= */}

                {error && (

                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                        onClose={() =>
                            setError("")
                        }
                    >
                        {error}
                    </Alert>

                )}


                {/* =================================================
                    NO BUILDING
                ================================================= */}

                {!selectedBuildingId && (

                    <Alert
                        severity="warning"
                        sx={{ mb: 3 }}
                    >
                        No building is selected.
                        Please select a building from the
                        building selector before configuring
                        settings.
                    </Alert>

                )}


                {/* =================================================
                    BUILDING CONFIGURATION
                ================================================= */}

                <Card
                    sx={{
                        mb: 3,
                        borderRadius: 3,
                        border:
                            "1px solid #E2E8F0",
                    }}
                >

                    <CardContent sx={{ p: 3 }}>

                        <Typography
                            variant="h6"
                            fontWeight={700}
                        >
                            Building Configuration
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5, mb: 3 }}
                        >
                            Basic information about the
                            monitored building.
                        </Typography>

                        <Divider sx={{ mb: 3 }} />


                        <Grid
                            container
                            spacing={2.5}
                        >

                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6,
                                }}
                            >

                                <TextField
                                    fullWidth
                                    label="Building Name"
                                    name="building_name"
                                    value={
                                        buildingForm.building_name
                                    }
                                    onChange={
                                        handleBuildingChange
                                    }
                                    disabled={
                                        !selectedBuildingId ||
                                        loading
                                    }
                                />

                            </Grid>


                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6,
                                }}
                            >

                                <TextField
                                    fullWidth
                                    label="Location"
                                    name="location"
                                    value={
                                        buildingForm.location
                                    }
                                    onChange={
                                        handleBuildingChange
                                    }
                                    disabled={
                                        !selectedBuildingId ||
                                        loading
                                    }
                                />

                            </Grid>


                            <Grid
                                size={{
                                    xs: 12,
                                    md: 6,
                                }}
                            >

                                <TextField
                                    fullWidth
                                    label="Total Floors"
                                    name="total_floors"
                                    type="number"
                                    value={
                                        buildingForm.total_floors
                                    }
                                    onChange={
                                        handleBuildingChange
                                    }
                                    disabled={
                                        !selectedBuildingId ||
                                        loading
                                    }
                                    inputProps={{
                                        min: 1,
                                    }}
                                />

                            </Grid>


                            <Grid
                                size={{
                                    xs: 12,
                                }}
                            >

                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Description"
                                    name="description"
                                    value={
                                        buildingForm.description
                                    }
                                    onChange={
                                        handleBuildingChange
                                    }
                                    disabled={
                                        !selectedBuildingId ||
                                        loading
                                    }
                                />

                            </Grid>

                        </Grid>


                        <Box sx={{ mt: 3 }}>

                            <Button
                                variant="contained"
                                onClick={
                                    handleSaveBuilding
                                }
                                disabled={
                                    !selectedBuildingId ||
                                    savingBuilding
                                }
                            >
                                {savingBuilding
                                    ? "Saving..."
                                    : "Save Building"}
                            </Button>

                        </Box>

                    </CardContent>

                </Card>


                {/* =================================================
                    SENSOR THRESHOLDS
                ================================================= */}

                <Card
                    sx={{
                        mb: 3,
                        borderRadius: 3,
                        border:
                            "1px solid #E2E8F0",
                    }}
                >

                    <CardContent sx={{ p: 3 }}>

                        <Typography
                            variant="h6"
                            fontWeight={700}
                        >
                            Sensor Thresholds
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mt: 0.5,
                                mb: 3,
                            }}
                        >
                            Define the limits used by the
                            monitoring system to identify
                            abnormal conditions.
                        </Typography>

                        <Divider sx={{ mb: 3 }} />


                        <Grid
                            container
                            spacing={2.5}
                        >

                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 3,
                                }}
                            >

                                <TextField
                                    fullWidth
                                    label="Temperature Warning"
                                    type="number"
                                    value={
                                        settings.temperatureWarning
                                    }
                                    onChange={(event) =>
                                        handleSettingChange(
                                            "temperatureWarning",
                                            Number(
                                                event.target.value
                                            )
                                        )
                                    }
                                    InputProps={{
                                        endAdornment:
                                            "°C",
                                    }}
                                />

                            </Grid>


                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 3,
                                }}
                            >

                                <TextField
                                    fullWidth
                                    label="Gas Warning"
                                    type="number"
                                    value={
                                        settings.gasWarning
                                    }
                                    onChange={(event) =>
                                        handleSettingChange(
                                            "gasWarning",
                                            Number(
                                                event.target.value
                                            )
                                        )
                                    }
                                    InputProps={{
                                        endAdornment:
                                            "ppm",
                                    }}
                                />

                            </Grid>


                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 3,
                                }}
                            >

                                <TextField
                                    fullWidth
                                    label="Gas Critical"
                                    type="number"
                                    value={
                                        settings.gasCritical
                                    }
                                    onChange={(event) =>
                                        handleSettingChange(
                                            "gasCritical",
                                            Number(
                                                event.target.value
                                            )
                                        )
                                    }
                                    InputProps={{
                                        endAdornment:
                                            "ppm",
                                    }}
                                />

                            </Grid>


                            <Grid
                                size={{
                                    xs: 12,
                                    sm: 6,
                                    md: 3,
                                }}
                            >

                                <TextField
                                    fullWidth
                                    label="Humidity Warning"
                                    type="number"
                                    value={
                                        settings.humidityWarning
                                    }
                                    onChange={(event) =>
                                        handleSettingChange(
                                            "humidityWarning",
                                            Number(
                                                event.target.value
                                            )
                                        )
                                    }
                                    InputProps={{
                                        endAdornment:
                                            "%",
                                    }}
                                />

                            </Grid>

                        </Grid>


                        {/* Threshold profile */}

                        <Box
                            sx={{
                                mt: 3,
                                p: 2,
                                borderRadius: 2,
                                backgroundColor:
                                    "#F8FAFC",
                            }}
                        >

                            <Typography
                                variant="subtitle1"
                                fontWeight={700}
                                sx={{ mb: 1 }}
                            >
                                Current Threshold Profile
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Temperature ≥{" "}
                                <strong>
                                    {
                                        settings.temperatureWarning
                                    }°C
                                </strong>
                                {" → Warning"}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Gas ≥{" "}
                                <strong>
                                    {
                                        settings.gasWarning
                                    } ppm
                                </strong>
                                {" → Warning"}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Gas ≥{" "}
                                <strong>
                                    {
                                        settings.gasCritical
                                    } ppm
                                </strong>
                                {" → Critical"}
                            </Typography>

                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Humidity ≥{" "}
                                <strong>
                                    {
                                        settings.humidityWarning
                                    }%
                                </strong>
                                {" → Warning"}
                            </Typography>

                        </Box>


                        <Box sx={{ mt: 3 }}>

                            <Button
                                variant="contained"
                                onClick={
                                    handleSaveSettings
                                }
                                disabled={
                                    savingSettings
                                }
                            >
                                {savingSettings
                                    ? "Saving..."
                                    : "Save Thresholds"}
                            </Button>

                        </Box>

                    </CardContent>

                </Card>


                {/* =================================================
                    ALERT SETTINGS
                ================================================= */}

                <Card
                    sx={{
                        mb: 3,
                        borderRadius: 3,
                        border:
                            "1px solid #E2E8F0",
                    }}
                >

                    <CardContent sx={{ p: 3 }}>

                        <Typography
                            variant="h6"
                            fontWeight={700}
                        >
                            Alert Settings
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mt: 0.5,
                                mb: 3,
                            }}
                        >
                            Control which safety events are
                            monitored by the dashboard.
                        </Typography>

                        <Divider sx={{ mb: 1 }} />


                        <Stack>

                            <SettingSwitch
                                title="Gas Alerts"
                                description="Detect warning and critical gas levels."
                                checked={
                                    settings.gasAlerts
                                }
                                onChange={(value) =>
                                    handleSettingChange(
                                        "gasAlerts",
                                        value
                                    )
                                }
                            />


                            <SettingSwitch
                                title="Temperature Alerts"
                                description="Generate alerts when temperature exceeds the configured limit."
                                checked={
                                    settings.temperatureAlerts
                                }
                                onChange={(value) =>
                                    handleSettingChange(
                                        "temperatureAlerts",
                                        value
                                    )
                                }
                            />


                            <SettingSwitch
                                title="Motion Alerts"
                                description="Monitor room occupancy and motion events."
                                checked={
                                    settings.motionAlerts
                                }
                                onChange={(value) =>
                                    handleSettingChange(
                                        "motionAlerts",
                                        value
                                    )
                                }
                            />


                            <SettingSwitch
                                title="Browser Notifications"
                                description="Allow safety alerts to appear as browser notifications."
                                checked={
                                    settings.browserNotifications
                                }
                                onChange={
                                    handleBrowserNotification
                                }
                            />

                        </Stack>

                    </CardContent>

                </Card>


                {/* =================================================
                    DASHBOARD PREFERENCES
                ================================================= */}

                <Card
                    sx={{
                        mb: 3,
                        borderRadius: 3,
                        border:
                            "1px solid #E2E8F0",
                    }}
                >

                    <CardContent sx={{ p: 3 }}>

                        <Typography
                            variant="h6"
                            fontWeight={700}
                        >
                            Dashboard Preferences
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mt: 0.5,
                                mb: 3,
                            }}
                        >
                            Configure real-time dashboard
                            behavior.
                        </Typography>

                        <Divider sx={{ mb: 1 }} />


                        <SettingSwitch
                            title="Automatic Refresh"
                            description="Automatically refresh dashboard data."
                            checked={
                                settings.automaticRefresh
                            }
                            onChange={(value) =>
                                handleSettingChange(
                                    "automaticRefresh",
                                    value
                                )
                            }
                        />


                        <SettingSwitch
                            title="Live WebSocket Updates"
                            description="Receive real-time sensor updates."
                            checked={
                                settings.websocketUpdates
                            }
                            onChange={(value) =>
                                handleSettingChange(
                                    "websocketUpdates",
                                    value
                                )
                            }
                        />


                        <Box sx={{ mt: 2 }}>

                            <TextField
                                label="Refresh Interval"
                                type="number"
                                value={
                                    settings.refreshInterval
                                }
                                onChange={(event) =>
                                    handleSettingChange(
                                        "refreshInterval",
                                        Math.max(
                                            1,
                                            Number(
                                                event.target.value
                                            )
                                        )
                                    )
                                }
                                helperText="Interval in seconds"
                                inputProps={{
                                    min: 1,
                                }}
                                sx={{
                                    width: 240,
                                }}
                                disabled={
                                    !settings.automaticRefresh
                                }
                            />

                        </Box>


                        <Box sx={{ mt: 3 }}>

                            <Button
                                variant="contained"
                                onClick={
                                    handleSaveSettings
                                }
                            >
                                Save Preferences
                            </Button>

                        </Box>

                    </CardContent>

                </Card>


                {/* =================================================
                    SYSTEM INFORMATION
                ================================================= */}

                <Card
                    sx={{
                        mb: 3,
                        borderRadius: 3,
                        border:
                            "1px solid #E2E8F0",
                    }}
                >

                    <CardContent sx={{ p: 3 }}>

                        <Typography
                            variant="h6"
                            fontWeight={700}
                        >
                            System Information
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mt: 0.5,
                                mb: 3,
                            }}
                        >
                            Current AI Digital Twin system
                            configuration.
                        </Typography>

                        <Divider sx={{ mb: 2 }} />


                        <Stack spacing={1.5}>

                            <SystemRow
                                label="System"
                                value="AI Digital Twin"
                            />

                            <SystemRow
                                label="Building"
                                value={
                                    building?.building_name ||
                                    building?.name ||
                                    "Not selected"
                                }
                            />

                            <SystemRow
                                label="Backend"
                                value={
                                    <Chip
                                        size="small"
                                        label={
                                            backendStatus
                                        }
                                        color={
                                            backendStatus ===
                                                "Connected"
                                                ? "success"
                                                : "default"
                                        }
                                    />
                                }
                            />

                            <SystemRow
                                label="Database"
                                value="MongoDB"
                            />

                            <SystemRow
                                label="Real-time"
                                value={
                                    settings.websocketUpdates
                                        ? "WebSocket ON"
                                        : "WebSocket OFF"
                                }
                            />

                        </Stack>

                    </CardContent>

                </Card>


                {/* =================================================
                    SAVE ALL
                ================================================= */}

                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mb: 4,
                    }}
                >

                    <Button
                        size="large"
                        variant="contained"
                        onClick={() => {

                            handleSaveSettings();

                            if (
                                selectedBuildingId
                            ) {
                                handleSaveBuilding();
                            }

                        }}
                        disabled={
                            savingBuilding ||
                            savingSettings ||
                            !selectedBuildingId
                        }
                    >
                        Save Configuration
                    </Button>

                </Box>


                {/* =================================================
                    SUCCESS MESSAGE
                ================================================= */}

                <Snackbar
                    open={Boolean(success)}
                    autoHideDuration={3500}
                    onClose={() =>
                        setSuccess("")
                    }
                    message={success}
                />

            </Box>

        </Layout>
    );
}


/* =========================================================
   SETTING SWITCH
========================================================= */

function SettingSwitch({
    title,
    description,
    checked,
    onChange,
}) {

    return (

        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                py: 1.5,
            }}
        >

            <Box>

                <Typography
                    fontWeight={600}
                >
                    {title}
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                >
                    {description}
                </Typography>

            </Box>

            <Switch
                checked={Boolean(checked)}
                onChange={(event) =>
                    onChange(
                        event.target.checked
                    )
                }
            />

        </Box>

    );
}


/* =========================================================
   SYSTEM ROW
========================================================= */

function SystemRow({
    label,
    value,
}) {

    return (

        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
            }}
        >

            <Typography
                variant="body2"
                color="text.secondary"
            >
                {label}
            </Typography>

            <Typography
                variant="body2"
                fontWeight={600}
            >
                {value}
            </Typography>

        </Box>

    );
}


export default Settings;
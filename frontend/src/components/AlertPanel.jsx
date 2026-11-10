import {
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
    Chip,
} from "@mui/material";

function AlertPanel({ alerts }) {

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
                🚨 Live Alerts
            </Typography>

            <List>

                {alerts.length === 0 && (

                    <Typography color="green">
                        No Active Alerts
                    </Typography>

                )}

                {alerts.map((alert, index) => (

                    <ListItem
                        key={index}
                        divider
                    >

                        <ListItemText
                            primary={alert.message}
                            secondary={alert.time}
                        />

                        <Chip
                            label={alert.level}
                            color={
                                alert.level === "Danger"
                                    ? "error"
                                    : alert.level === "Warning"
                                        ? "warning"
                                        : "success"
                            }
                        />

                    </ListItem>

                ))}

            </List>

        </Paper>

    );

}

export default AlertPanel;
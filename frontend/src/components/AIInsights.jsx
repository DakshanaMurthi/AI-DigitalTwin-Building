import {
    Paper,
    Typography,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";

function AIInsights({ dashboard }) {

    if (!dashboard) return null;

    const insights = [];

    if (dashboard.environment.average_temperature > 30) {
        insights.push("🔥 High temperature detected.");
    } else {
        insights.push("✅ Temperature is normal.");
    }

    if (dashboard.environment.average_humidity > 70) {
        insights.push("💧 High humidity detected.");
    } else {
        insights.push("✅ Humidity level is normal.");
    }

    if (dashboard.environment.average_gas_level > 500) {
        insights.push("⚠ Poor air quality detected.");
    } else {
        insights.push("✅ Air quality is good.");
    }

    insights.push("🏢 Building status is healthy.");

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
                🧠 AI Insights
            </Typography>

            <List>
                {insights.map((item, index) => (
                    <ListItem key={index}>
                        <ListItemText primary={item} />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
}

export default AIInsights;
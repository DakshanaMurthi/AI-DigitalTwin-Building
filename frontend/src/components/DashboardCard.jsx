import {
    Card,
    CardContent,
    Typography,
    Chip,
    Box,
} from "@mui/material";

function DashboardCard({
    title,
    value,
    unit,
    icon,
    color = "#1976d2",
    status = "Normal",
}) {
    return (
        <Card
            elevation={6}
            sx={{
                height: "100%",
                borderRadius: 4,
                transition: "0.3s",
                borderTop: `6px solid ${color}`,

                "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: 10,
                },
            }}
        >
            <CardContent
                sx={{
                    minHeight: 150,
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* TITLE + ICON */}
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        fontWeight="bold"
                    >
                        {title}
                    </Typography>

                    {icon && (
                        <Box
                            sx={{
                                color,
                                fontSize: 34,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            {icon}
                        </Box>
                    )}
                </Box>

                {/* VALUE */}
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "baseline",
                        mt: 2,
                    }}
                >
                    <Typography
                        variant="h3"
                        fontWeight="bold"
                        sx={{
                            color: "#111827",
                        }}
                    >
                        {value}
                    </Typography>

                    {unit && (
                        <Typography
                            component="span"
                            variant="h6"
                            sx={{
                                ml: 1,
                                color: "#475569",
                            }}
                        >
                            {unit}
                        </Typography>
                    )}
                </Box>

                {/* STATUS */}
                <Chip
                    label={status}
                    size="small"
                    sx={{
                        mt: "auto",
                        pt: 0.5,
                        pb: 0.5,
                        width: "fit-content",
                        backgroundColor: color,
                        color: "#fff",
                        fontWeight: "bold",
                    }}
                />
            </CardContent>
        </Card>
    );
}

export default DashboardCard;
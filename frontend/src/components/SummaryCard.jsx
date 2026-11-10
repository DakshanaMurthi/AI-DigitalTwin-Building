import { Card, CardContent, Typography } from "@mui/material";

function SummaryCard({ title, value }) {
    return (
        <Card
            sx={{
                minWidth: 220,
                borderRadius: 3,
            }}
        >
            <CardContent>

                <Typography color="text.secondary">
                    {title}
                </Typography>

                <Typography
                    variant="h4"
                    sx={{ mt: 1 }}
                >
                    {value}
                </Typography>

            </CardContent>
        </Card>
    );
}

export default SummaryCard;
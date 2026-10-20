
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Container,
    Paper,
    TextField,
    Typography,
    CircularProgress,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export default function AdminLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email.trim().toLowerCase(), password);
            navigate("/", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Unable to log in. Check your credentials and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container
            maxWidth="sm"
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Paper
                elevation={5}
                sx={{
                    width: "100%",
                    maxWidth: 440,
                    p: { xs: 3, sm: 5 },
                    borderRadius: 3,
                }}
            >
                <Box sx={{ textAlign: "center", mb: 4 }}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Digital Twin
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                        Administrator Login
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Sign in to access the building monitoring dashboard.
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        label="Email address"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        fullWidth
                        required
                        autoComplete="username"
                        margin="normal"
                        disabled={loading}
                    />

                    <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        fullWidth
                        required
                        autoComplete="current-password"
                        margin="normal"
                        disabled={loading}
                    />

                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={loading}
                        sx={{ mt: 3, py: 1.4, borderRadius: 2 }}
                    >
                        {loading ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
}

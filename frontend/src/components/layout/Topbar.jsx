
import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Avatar,
    Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

function Topbar() {
    const { admin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login", { replace: true });
        }
    };

    return (
        <AppBar
            position="fixed"
            sx={{
                ml: "240px",
                width: "calc(100% - 240px)",
                backgroundColor: "#ffffff",
                color: "#111827",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
        >
            <Toolbar sx={{ minHeight: "64px !important" }}>
                <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ whiteSpace: "nowrap" }}
                >
                    AI Digital Twin Office Dashboard
                </Typography>

                <Box sx={{ flexGrow: 1 }} />

                <Typography
                    sx={{
                        mr: 3,
                        fontWeight: 600,
                        color: "#475569",
                    }}
                >
                    Main Building
                </Typography>

                <Typography
                    sx={{
                        mr: 1,
                        fontWeight: 600,
                        color: "#475569",
                    }}
                >
                    Admin
                </Typography>

                <Avatar sx={{ backgroundColor: "#1976d2", mx: 1 }}>
                    {(admin?.email || "A").charAt(0).toUpperCase()}
                </Avatar>

                <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleLogout}
                    sx={{ ml: 1, whiteSpace: "nowrap" }}
                >
                    Logout
                </Button>
            </Toolbar>
        </AppBar>
    );
}

export default Topbar;

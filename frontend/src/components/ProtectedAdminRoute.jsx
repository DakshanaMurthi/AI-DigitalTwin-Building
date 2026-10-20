
import { Navigate, Outlet } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedAdminRoute() {
    const { admin, loading } = useAuth();

    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!admin) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

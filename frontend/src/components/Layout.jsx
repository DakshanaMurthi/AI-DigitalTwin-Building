import { Box, Toolbar } from "@mui/material";

import Sidebar from "./layout/Sidebar";
import Topbar from "./layout/Topbar";

function Layout({ children }) {
    return (
        <Box
            sx={{
                display: "flex",
                minHeight: "100vh",
                bgcolor: "#F4F7FC",
            }}
        >
            <Sidebar />

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: "calc(100% - 240px)",
                    minWidth: 0,
                    minHeight: "100vh",
                    bgcolor: "#F4F7FC",
                }}
            >
                <Topbar />

                <Toolbar />

                <Box
                    sx={{
                        width: "100%",
                        px: { xs: 2, sm: 3, md: 4 },
                        py: 3,
                        boxSizing: "border-box",
                    }}
                >
                    {children}
                </Box>
            </Box>
        </Box>
    );
}

export default Layout;
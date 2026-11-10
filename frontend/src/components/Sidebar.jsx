import {
    Box,
    List,
    ListItemButton,
    ListItemText,
} from "@mui/material";

import { Link, useLocation } from "react-router-dom";

function Sidebar() {
    const location = useLocation();

    const menuItems = [
        {
            label: "Dashboard",
            path: "/",
        },
        {
            label: "Rooms",
            path: "/rooms",
        },
        {
            label: "Analytics",
            path: "/analytics",
        },
        {
            label: "Alerts",
            path: "/alerts",
        },
        {
            label: "Settings",
            path: "/settings",
        },
    ];

    return (
        <Box
            sx={{
                width: 220,
                flexShrink: 0,
                height: "100vh",
                position: "fixed",
                left: 0,
                top: 0,
                zIndex: 1200,
                bgcolor: "#0F172A",
                color: "#FFFFFF",
                borderRight: "1px solid rgba(255,255,255,0.08)",
                overflowY: "auto",
            }}
        >
            {/* Brand */}
            <Box
                sx={{
                    px: 2.5,
                    pt: 2,
                    pb: 2.5,
                }}
            >
                <Box
                    sx={{
                        fontSize: "1.15rem",
                        fontWeight: 700,
                        lineHeight: 1.2,
                    }}
                >
                    AI Digital Twin
                </Box>

                <Box
                    sx={{
                        mt: 0.5,
                        fontSize: "0.8rem",
                        color: "#93C5FD",
                    }}
                >
                    Office Management
                </Box>
            </Box>

            {/* Navigation */}
            <List sx={{ px: 1.25 }}>
                {menuItems.map((item) => {
                    const active =
                        location.pathname === item.path;

                    return (
                        <ListItemButton
                            key={item.path}
                            component={Link}
                            to={item.path}
                            sx={{
                                minHeight: 46,
                                mb: 0.5,
                                px: 1.75,
                                borderRadius: 2,

                                color: active
                                    ? "#60A5FA"
                                    : "#FFFFFF",

                                bgcolor: active
                                    ? "rgba(96,165,250,0.14)"
                                    : "transparent",

                                "&:hover": {
                                    bgcolor:
                                        "rgba(96,165,250,0.10)",
                                },
                            }}
                        >
                            <ListItemText
                                primary={item.label}
                                primaryTypographyProps={{
                                    fontSize: "0.95rem",
                                    fontWeight: active
                                        ? 600
                                        : 500,
                                }}
                            />
                        </ListItemButton>
                    );
                })}
            </List>
        </Box>
    );
}

export default Sidebar;
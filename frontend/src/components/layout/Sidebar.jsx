import {
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Box,
} from "@mui/material";

import {
    MdDashboard,
    MdMeetingRoom,
    MdInsights,
    MdWarning,
    MdSettings,
} from "react-icons/md";

import {
    Link,
    useLocation,
} from "react-router-dom";


const drawerWidth = 240;


const menuItems = [
    {
        text: "Dashboard",
        icon: <MdDashboard size={22} />,
        path: "/",
    },

    {
        text: "Rooms",
        icon: <MdMeetingRoom size={22} />,
        path: "/rooms",
    },

    {
        text: "Analytics",
        icon: <MdInsights size={22} />,
        path: "/analytics",
    },

    {
        text: "Alerts",
        icon: <MdWarning size={22} />,
        path: "/alerts",
    },

    {
        text: "Settings",
        icon: <MdSettings size={22} />,
        path: "/settings",
    },
];


function Sidebar() {

    const location =
        useLocation();


    return (

        <Drawer
            variant="permanent"

            sx={{
                width:
                    drawerWidth,

                flexShrink:
                    0,

                "& .MuiDrawer-paper": {
                    width:
                        drawerWidth,

                    boxSizing:
                        "border-box",

                    backgroundColor:
                        "#0F172A",

                    color:
                        "#FFFFFF",

                    borderRight:
                        "none",
                },
            }}
        >

            {/* =====================================================
                SIDEBAR HEADER
            ===================================================== */}

            <Toolbar
                sx={{
                    minHeight:
                        "72px !important",

                    px:
                        2.5,

                    alignItems:
                        "center",
                }}
            >

                <Box>

                    <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                            color:
                                "#FFFFFF",

                            lineHeight:
                                1.2,
                        }}
                    >
                        AI Digital Twin
                    </Typography>


                    <Typography
                        variant="body2"
                        sx={{
                            color:
                                "#94A3B8",

                            mt:
                                0.4,
                        }}
                    >
                        Office Management
                    </Typography>

                </Box>

            </Toolbar>


            {/* =====================================================
                NAVIGATION
            ===================================================== */}

            <List
                sx={{
                    px:
                        0.5,

                    pt:
                        1,
                }}
            >

                {menuItems.map(
                    (item) => {

                        const isActive =
                            location.pathname ===
                            item.path;


                        return (

                            <ListItemButton
                                key={
                                    item.text
                                }

                                component={
                                    Link
                                }

                                to={
                                    item.path
                                }

                                selected={
                                    isActive
                                }

                                sx={{
                                    mx:
                                        0.5,

                                    my:
                                        0.5,

                                    minHeight:
                                        48,

                                    borderRadius:
                                        2,

                                    backgroundColor:
                                        isActive
                                            ? "#1E293B"
                                            : "transparent",

                                    color:
                                        isActive
                                            ? "#3B82F6"
                                            : "#FFFFFF",

                                    transition:
                                        "background-color 0.2s ease, color 0.2s ease",

                                    "&:hover": {
                                        backgroundColor:
                                            "#1E293B",

                                        color:
                                            "#3B82F6",
                                    },

                                    "&.Mui-selected": {
                                        backgroundColor:
                                            "#1E293B",

                                        color:
                                            "#3B82F6",
                                    },

                                    "&.Mui-selected:hover": {
                                        backgroundColor:
                                            "#1E293B",
                                    },
                                }}
                            >

                                <ListItemIcon
                                    sx={{
                                        minWidth:
                                            40,

                                        color:
                                            "inherit",

                                        display:
                                            "flex",

                                        alignItems:
                                            "center",
                                    }}
                                >
                                    {
                                        item.icon
                                    }
                                </ListItemIcon>


                                <ListItemText
                                    primary={
                                        item.text
                                    }

                                    primaryTypographyProps={{
                                        fontWeight:
                                            isActive
                                                ? 600
                                                : 500,

                                        fontSize:
                                            "0.95rem",
                                    }}
                                />

                            </ListItemButton>

                        );

                    }
                )}

            </List>

        </Drawer>
    );
}


export default Sidebar;
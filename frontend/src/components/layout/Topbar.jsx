import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    Avatar,
} from "@mui/material";


function Topbar() {

    return (
        <AppBar
            position="fixed"
            sx={{
                ml: "240px",
                width: "calc(100% - 240px)",
                backgroundColor: "#ffffff",
                color: "#111827",
                boxShadow:
                    "0 2px 10px rgba(0,0,0,0.08)",
                zIndex: (theme) =>
                    theme.zIndex.drawer + 1,
            }}
        >

            <Toolbar
                sx={{
                    minHeight:
                        "64px !important",
                }}
            >

                <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{
                        whiteSpace: "nowrap",
                    }}
                >
                    AI Digital Twin Office Dashboard
                </Typography>


                <Box
                    sx={{
                        flexGrow: 1,
                    }}
                />


                <Typography
                    sx={{
                        mr: 4,
                        fontWeight: 600,
                        color: "#475569",
                    }}
                >
                    Main Building
                </Typography>


                <Typography
                    sx={{
                        mr: 3,
                    }}
                >
                    Admin
                </Typography>


                <Avatar
                    sx={{
                        backgroundColor:
                            "#1976d2",
                    }}
                >
                    A
                </Avatar>

            </Toolbar>

        </AppBar>
    );
}


export default Topbar;
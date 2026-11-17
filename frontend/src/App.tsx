import {
    Navigate,
    Route,
    Routes,
    useLocation
} from "react-router-dom";
import PronunciationPage from "./pages/pronunciation_page";
import AuthPage from "./pages/auth_page";
import { useAuth } from "./components/auth_provider";
import ApplicationLayout from "./components/application_layout";
import HomePage from "./pages/home_page";
import HistoryPage from "./pages/history_page";
import { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, CssBaseline } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";



//APP IS NOW A ROUTER SON
export default function App() {
    const { session, isLoading, isPasswordRecovery } = useAuth();
    const location = useLocation();


    const [mode, setMode] = useState<"light" | "dark">(() => {
        const savedMode = localStorage.getItem("theme");

        if (savedMode === "light" || savedMode === "dark") {
            return savedMode;
        }

        return window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";
    });

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", mode);
        localStorage.setItem("theme", mode);
    }, [mode]);


    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            primary: {
                main: mode === "dark" ? "#d7b5ff" : "#4b1e69",
                contrastText: mode === "dark" ? "#0d0b12" : "#ffffff"
            },
            secondary: {
                main: mode === "dark" ? "#ff91c3" : "#a31963",
                contrastText: mode === "dark" ? "#0d0b12" : "#ffffff"
            },
            background: {
                default: mode === "dark" ? "#0d0b12" : "#fff9e8",
                paper: mode === "dark" ? "#262031" : "#fffcf3"
            },
            text: {
                primary: mode === "dark" ? "#ffffff" : "#24202b",
                secondary: mode === "dark" ? "#d6c9e1" : "#65566e"
            },
            divider: mode === "dark" ? "#a18faf" : "#dfd3d9"
        },
        components: {
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        ...(mode === "dark" && {
                            backgroundColor: "#17121f",
                            color: "#ffffff",
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#a18faf"
                            },
                            "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#d7b5ff"
                            },
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#ff91c3",
                                borderWidth: 2
                            }
                        })
                    }
                }
            },
            MuiInputBase: {
                styleOverrides: {
                    input: {
                        ...(mode === "dark" && {
                            color: "#ffffff",
                            "&::placeholder": {
                                color: "#d6c9e1",
                                opacity: 1
                            }
                        })
                    }
                }
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        ...(mode === "dark" && {
                            backgroundImage: "none"
                        })
                    }
                }
            }
        }
    }), [mode]);



    if (isLoading) {
        return (
            <Box className="appShell" display="flex" alignItems="center" justifyContent="center">
                <CircularProgress aria-label="Restoring your session" />
            </Box>
        );
    }

    if (isPasswordRecovery && location.pathname !== "/update-password") {
        return <Navigate to="/update-password" replace />;
    }


    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {isLoading ? (
                <Box className="appShell" display="flex" alignItems="center" justifyContent="center">
                    <CircularProgress aria-label="Restoring your session" />
                </Box>
            ) : isPasswordRecovery && location.pathname !== "/update-password" ? (
                <Navigate to="/update-password" replace />
            ) : (
                <Routes>
                    <Route element={session ? <ApplicationLayout mode={mode} setMode={setMode} /> : <Navigate to="/login" replace />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/practice" element={<PronunciationPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                    </Route>
                    <Route path="/login" element={<AuthPage key="login" mode="login" />} />
                    <Route path="/signup" element={<AuthPage key="signup" mode="signup" />} />
                    <Route path="/reset-password" element={<AuthPage key="reset-password" mode="reset-password" />} />
                    <Route path="/update-password" element={<AuthPage key="update-password" mode="update-password" />} />
                    <Route path="/auth/callback" element={<AuthPage key="callback" mode="callback" />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            )}
        </ThemeProvider>
    );

}

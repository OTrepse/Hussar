import {
    Navigate,
    Route,
    Routes,
    useLocation
} from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

import PronunciationPage from "./pages/pronunciation_page";
import AuthPage from "./pages/auth_page";
import { useAuth } from "./components/auth_provider";
import ApplicationLayout from "./components/application_layout";
import HomePage from "./pages/home_page";
import HistoryPage from "./pages/history_page";

//APP IS NOW A ROUTER SON
export default function App() {
    const { session, isLoading, isPasswordRecovery } = useAuth();
    const location = useLocation();

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
        <Routes>
            <Route element={session ? <ApplicationLayout /> : <Navigate to="/login" replace />}>
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
    );
}

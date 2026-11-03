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
            {/*Default Route*/}
            <Route path="/" element={<Navigate to="/practice" replace/>} />
            {/*Practice Route*/}
            <Route path="/practice" element={session ? <PronunciationPage /> : <Navigate to="/login" replace />} />
            <Route path="/login" element={<AuthPage key="login" mode="login" />} />
            <Route path="/signup" element={<AuthPage key="signup" mode="signup" />} />
            <Route path="/reset-password" element={<AuthPage key="reset-password" mode="reset-password" />} />
            <Route path="/update-password" element={<AuthPage key="update-password" mode="update-password" />} />
            <Route path="/auth/callback" element={<AuthPage key="callback" mode="callback" />} />
            <Route path="*" element={<Navigate to="/practice" replace />} />
        </Routes>
    );
}

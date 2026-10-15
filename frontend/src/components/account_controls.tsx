import { Alert, Button, Stack } from "@mui/material";
import { useState } from "react";
import { supabase } from "../api/supabase_client";

export default function AccountControls() {
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleLogout() {
        if (!supabase) return;

        setIsSigningOut(true);
        setError(null);
        try {
            const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
            if (signOutError) throw signOutError;
        } catch (signOutError) {
            setError(signOutError instanceof Error ? signOutError.message : "Unable to log out. Please try again.");
        } finally {
            setIsSigningOut(false);
        }
    }

    return (
        <Stack spacing={1}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} justifyContent="flex-end">
                <Button variant="outlined" onClick={handleLogout} disabled={isSigningOut}>
                    {isSigningOut ? "Logging out..." : "Logout"}
                </Button>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
        </Stack>
    );
}

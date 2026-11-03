import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigurationError } from "../api/supabase_client";

interface AuthContextValue {
    session: Session | null;
    isLoading: boolean;
    error: string | null;
    isPasswordRecovery: boolean;
    finishPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(Boolean(supabase));
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
    const [error, setError] = useState<string | null>(() => {
        const params = new URLSearchParams(window.location.hash.slice(1));
        return supabaseConfigurationError ?? params.get("error_description");
    });

    useEffect(() => {
        if (!supabase) return;

        let active = true;
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
            if (!active) return;

            setSession(nextSession);
            setIsLoading(false);
            if (nextSession) setError(null);
            if (event === "PASSWORD_RECOVERY") setIsPasswordRecovery(true);
            if (event === "SIGNED_OUT") setIsPasswordRecovery(false);
        });

        supabase.auth.getSession()
            .then(({ data, error: sessionError }) => {
                if (!active) return;

                setSession(data.session);
                if (sessionError) setError(sessionError.message);
                setIsLoading(false);
            })
            .catch((sessionError: unknown) => {
                if (!active) return;

                setSession(null);
                setError(sessionError instanceof Error ? sessionError.message : "Unable to restore your session. Please log in again.");
                setIsLoading(false);
            });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{
            session,
            isLoading,
            error,
            isPasswordRecovery,
            finishPasswordRecovery: () => setIsPasswordRecovery(false),
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

let client: SupabaseClient | null = null;
let configurationError: string | null = null;

if (!supabaseUrl || !supabaseKey) {
    configurationError = "Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env, then restart the frontend.";
} else {
    try {
        // Accept only browser-safe publishable keys or the legacy anon key.
        const isPublicKey = supabaseKey.startsWith("sb_publishable_")
            || JSON.parse(atob(supabaseKey.split(".")[1] ?? "")).role === "anon";

        if (!isPublicKey) {
            throw new Error("Invalid public key");
        }

        client = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                flowType: "implicit",
            },
        });
    } catch {
        configurationError = "Check the Supabase URL and publishable key in frontend/.env. Use a publishable key (or legacy anon key), never a secret or service-role key.";
    }
}

export const supabase = client;
export const supabaseConfigurationError = configurationError;

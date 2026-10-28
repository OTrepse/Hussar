import { Alert, Box, Button, Container, Link, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState, type FormEvent } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../api/supabase_client";
import { useAuth } from "../components/auth_provider";
import BrandMark from "../components/brand_mark";

type AuthMode = "login" | "signup" | "reset-password" | "update-password" | "callback";

const titles: Record<AuthMode, string> = {
    login: "Login",
    signup: "Create Account",
    "reset-password": "Reset Password",
    "update-password": "Set New Password",
    callback: "Email Verification",
};

const introductions: Record<AuthMode, string> = {
    login: "Welcome back. Your next word is waiting.",
    signup: "Start building your confidence, one Polish word at a time.",
    "reset-password": "We'll help you get back to learning.",
    "update-password": "Choose a new password for your Mówka account.",
    callback: "A small step toward your Polish learning journey.",
};

export default function AuthPage({ mode }: { mode: AuthMode }) {
    const { session, error: sessionError, finishPasswordRecovery } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (session && (mode === "login" || mode === "signup" || mode === "callback")) {
        return <Navigate to="/" replace />;
    }

    const needsConfirmation = mode === "signup" || mode === "update-password";
    const canSubmit = Boolean(supabase)
        && mode !== "callback"
        && (mode !== "update-password" || Boolean(session));

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!supabase || isSubmitting) return;

        setError(null);
        setMessage(null);
        if (needsConfirmation && password !== confirmation) {
            setError("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);
        try {
            if (mode === "login") {
                const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
                if (authError) {
                    if (authError.code === "email_not_confirmed") setVerificationEmail(email.trim());
                    throw authError;
                }
            } else if (mode === "signup") {
                const { data, error: authError } = await supabase.auth.signUp({
                    email: email.trim(),
                    password,
                    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
                });
                if (authError) throw authError;
                if (!data.session) {
                    setMessage("Check your email and follow the verification link to finish creating your account.");
                    setVerificationEmail(email.trim());
                    setPassword("");
                    setConfirmation("");
                }
            } else if (mode === "reset-password") {
                const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                    redirectTo: `${window.location.origin}/update-password`,
                });
                if (authError) throw authError;
                setMessage("If an account exists for this email, you will receive a password reset link. Check your inbox and spam folder.");
            } else if (mode === "update-password") {
                const { error: authError } = await supabase.auth.updateUser({ password });
                if (authError) throw authError;
                finishPasswordRecovery();
                navigate("/", { replace: true });
            }
        } catch (authError) {
            setError(authError instanceof Error ? authError.message : "Authentication failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function resendVerification() {
        if (!supabase || !verificationEmail || isSubmitting) return;

        setIsSubmitting(true);
        setError(null);
        try {
            const { error: authError } = await supabase.auth.resend({
                type: "signup",
                email: verificationEmail,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            });
            if (authError) throw authError;
            setMessage("Verification email requested. Check your inbox and spam folder.");
        } catch (authError) {
            setError(authError instanceof Error ? authError.message : "Unable to resend the verification email.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Box component="main" className="appShell authShell" id="main-content">
            <Container maxWidth="sm" className="authWorkspace">
                <Box className="authBrand">
                    <Link component={RouterLink} to="/" className="brand" underline="none" aria-label="Mówka home">
                        <BrandMark />
                        <span>Mówka</span>
                    </Link>
                    <Typography color="text.secondary">A little practice. A more confident Polish.</Typography>
                </Box>
                <Paper className="pronunciationPanel authCard" elevation={0}>
                    <Stack spacing={3}>
                        <Box>
                            <Typography className="eyebrow">YOUR POLISH LEARNING JOURNEY</Typography>
                            <Typography variant="h4" component="h1">{titles[mode]}</Typography>
                            <Typography color="text.secondary" sx={{ mt: 1 }}>{introductions[mode]}</Typography>
                        </Box>
                        {(error || sessionError) && <Alert severity="error">{error || sessionError}</Alert>}
                        {message && <Alert severity="success">{message}</Alert>}
                        {mode === "callback" && !session && !sessionError && (
                            <Alert severity="info">This verification link is missing or expired. Log in if you have already verified your email, or request another verification email by trying to log in.</Alert>
                        )}
                        {mode === "update-password" && !session && (
                            <Alert severity="info">Open the password reset link from your email to set a new password. If the link has expired, request another below.</Alert>
                        )}
                        {mode !== "callback" && (mode !== "update-password" || session) && (
                            <Box component="form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
                                <Stack spacing={2}>
                                    {mode !== "update-password" && (
                                        <TextField
                                            label="Email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            fullWidth
                                            value={email}
                                            onChange={(event) => setEmail(event.target.value)}
                                            disabled={isSubmitting || !canSubmit}
                                        />
                                    )}
                                    {mode !== "reset-password" && (
                                        <TextField
                                            label={mode === "update-password" ? "New Password" : "Password"}
                                            name="password"
                                            type="password"
                                            autoComplete={mode === "login" ? "current-password" : "new-password"}
                                            required
                                            fullWidth
                                            inputProps={{ minLength: needsConfirmation ? 8 : undefined }}
                                            helperText={needsConfirmation ? "Use at least 8 characters." : undefined}
                                            value={password}
                                            onChange={(event) => setPassword(event.target.value)}
                                            disabled={isSubmitting || !canSubmit}
                                        />
                                    )}
                                    {needsConfirmation && (
                                        <TextField
                                            label="Confirm Password"
                                            name="passwordConfirmation"
                                            type="password"
                                            autoComplete="new-password"
                                            required
                                            fullWidth
                                            value={confirmation}
                                            onChange={(event) => setConfirmation(event.target.value)}
                                            disabled={isSubmitting || !canSubmit}
                                        />
                                    )}
                                    <Button type="submit" variant="contained" disabled={isSubmitting || !canSubmit}>
                                        {isSubmitting ? "Please wait..." : mode === "reset-password" ? "Send Reset Link" : titles[mode]}
                                    </Button>
                                </Stack>
                            </Box>
                        )}
                        {verificationEmail && (
                            <Button onClick={resendVerification} disabled={isSubmitting || !supabase}>
                                Resend Verification Email
                            </Button>
                        )}
                        <Stack spacing={1} className="authLinks">
                            {mode !== "login" && <Link component={RouterLink} to="/login">Back to Login</Link>}
                            {mode === "login" && <Link component={RouterLink} to="/signup">Create Account</Link>}
                            {(mode === "login" || mode === "update-password") && (
                                <Link component={RouterLink} to="/reset-password">{mode === "login" ? "Forgot Password?" : "Request a New Reset Link"}</Link>
                            )}
                        </Stack>
                    </Stack>
                </Paper>
                <Typography className="authFootnote" color="text.secondary">Listen closely. Speak freely. Keep growing.</Typography>
            </Container>
        </Box>
    );
}

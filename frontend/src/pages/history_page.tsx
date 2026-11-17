import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, CircularProgress, Container, Stack, Typography } from "@mui/material";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import { Link } from "react-router-dom";
import { useAuth } from "../components/auth_provider";
import { listPronunciationHistory, type PronunciationHistoryEntry } from "../api/history_api";

interface HistoryState {
    userId: string;
    entries: PronunciationHistoryEntry[];
    error: boolean;
    loading: boolean;
}

export default function HistoryPage() {
    const { session } = useAuth();
    const userId = session?.user.id;
    const [state, setState] = useState<HistoryState | null>(null);
    const [reload, setReload] = useState(0);
    // Key data to its owner so switching accounts never flashes another history.
    const currentState = state?.userId === userId ? state : null;
    const loading = Boolean(userId) && (!currentState || currentState.loading);

    useEffect(() => {
        if (!userId) return;
        let active = true;
        setState({ userId, entries: [], error: false, loading: true });
        listPronunciationHistory(userId)
            .then(entries => {
                if (active) setState({ userId, entries, error: false, loading: false });
            })
            .catch(() => {
                if (active) setState({ userId, entries: [], error: true, loading: false });
            });
        return () => { active = false; };
    }, [userId, reload]);

    // A save can still be in flight when the learner opens History. Refresh on
    // completion without changing the pronunciation workflow or adding Realtime.
    useEffect(() => {
        const refresh = () => setReload(value => value + 1);
        window.addEventListener("pronunciation-history-saved", refresh);
        window.addEventListener("focus", refresh);
        return () => {
            window.removeEventListener("pronunciation-history-saved", refresh);
            window.removeEventListener("focus", refresh);
        };
    }, []);

    return (
        <Container maxWidth="lg" className="workspace historyWorkspace">
            <Typography className="eyebrow">YOUR LEARNING JOURNEY</Typography>
            <Typography component="h1" variant="h3" className="pageTitle">My Pronunciation History</Typography>
            <Typography color="text.secondary">Review your latest pronunciation attempt for each Polish word.</Typography>

            {!userId && <Alert severity="info" sx={{ mt: 4 }}>Log in to view your pronunciation history.</Alert>}
            {loading && (
                <Stack direction="row" spacing={2} alignItems="center" role="status" sx={{ mt: 4 }}>
                    <CircularProgress size={24} aria-label="Loading pronunciation history" />
                    <Typography>Loading your pronunciation history...</Typography>
                </Stack>
            )}
            {!loading && currentState?.error && (
                <Alert severity="error" sx={{ mt: 4 }} action={<Button color="inherit" onClick={() => setReload(value => value + 1)}>Try again</Button>}>
                    We couldn't load your pronunciation history. Please try again.
                </Alert>
            )}
            {!loading && currentState && !currentState.error && currentState.entries.length === 0 && (
                <Box className="historyEmpty">
                    <span className="historyIcon"><HistoryRoundedIcon fontSize="large" /></span>
                    <Typography component="h2" variant="h5">Your next word awaits.</Typography>
                    <Typography color="text.secondary">No pronunciation history yet. Start practicing Polish words to see your progress here!</Typography>
                    <Button component={Link} to="/practice" variant="contained" endIcon={<ArrowForwardRoundedIcon />}>Start practicing</Button>
                </Box>
            )}
            {!loading && currentState && !currentState.error && currentState.entries.length > 0 && (
                <Stack spacing={3} sx={{ mt: 4 }}>
                    <Button component={Link} to="/practice" variant="outlined" endIcon={<ArrowForwardRoundedIcon />} sx={{ alignSelf: "flex-start" }}>Continue practicing</Button>
                    <Box component="ul" aria-label="Latest pronunciation attempts" sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 3 }}>
                        {currentState.entries.map(entry => (
                            <Card key={entry.id} component="li" variant="outlined" sx={{ borderRadius: "22px", borderColor: "divider", bgcolor: "background.paper", overflowWrap: "anywhere" }}>
                                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                                    <Stack spacing={2}>
                                        <Typography component="h2" variant="h4" lang="pl" color="primary.main">{entry.word_text}</Typography>
                                        <Typography fontWeight={700} color="secondary.main">Latest Score: {entry.score}%</Typography>
                                        <Typography color="text.secondary">
                                            Last Practiced: <time dateTime={entry.attempted_at}>{new Date(entry.attempted_at).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })}</time>
                                        </Typography>
                                        {entry.feedback && <Typography sx={{ whiteSpace: "pre-wrap" }}>Feedback: {entry.feedback}</Typography>}
                                        {(entry.standard_score !== null || entry.contextual_score !== null) && (
                                            <Typography variant="body2" color="text.secondary">
                                                Standard match: {entry.standard_score === null ? "N/A" : `${entry.standard_score}%`}
                                                {" · "}Contextual match: {entry.contextual_score === null ? "N/A" : `${entry.contextual_score}%`}
                                            </Typography>
                                        )}
                                        <Typography variant="caption" color="text.secondary">Experimental transcription-match score</Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Stack>
            )}
        </Container>
    );
}

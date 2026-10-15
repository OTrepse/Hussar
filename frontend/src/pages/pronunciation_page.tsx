import {
    Box,
    CircularProgress,
    Container,
    Paper,
    Stack,
    Typography,
    MenuItem,
    TextField
} from "@mui/material";
import AudioRecorder from "../components/audio_recorder";
import {
    transcribeAudio,
} from "../api/speech_api";
import {useEffect, useState} from "react";
import {listPracticeItems} from "../api/practice_items_api";
import type {PracticeItem} from "../types/practice_item";

export default function PronunciationPage() {
    const [speechmaticsResult, setSpeechmaticsResult] = useState<unknown>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

    const selectedItem = practiceItems.find(item => item.id === selectedItemId);

    useEffect(() => {
        listPracticeItems()
            .then(items => {
                setPracticeItems(items);

                if (items.length > 0) {
                    setSelectedItemId(items[0].id);
                }
            })
            .catch(console.error);
    }, []);

    async function handleRecordingComplete(audio: Blob) {
        if (selectedItemId === null) return;

        try {
            setIsTranscribing(true);
            setError(null);
            setSpeechmaticsResult(null);

            const result = await transcribeAudio(audio, selectedItemId);

            setSpeechmaticsResult(result);
        } catch (error) {
            console.error(error);

            setError(
                error instanceof Error
                    ? error.message
                    : "Failed to transcribe audio."
            );
        } finally {
            setIsTranscribing(false);
        }
    }

    return (
        <Box className="appShell">

            <Container
                maxWidth="md"
                className="workspace"
            >

                <Paper
                    className="pronunciationPanel"
                    elevation={0}
                >

                    <Stack spacing={3}>

                        <Box>
                            <Typography
                                variant="h4"
                                component="h1"
                            >
                                Pronunciation Check
                            </Typography>

                            <Typography>
                                Polish pronunciation testing
                            </Typography>
                        </Box>

                        <Box className="wordPlaceholder">
                            <Stack spacing={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Practice Item"
                                    value={selectedItemId ?? ""}
                                    onChange={(event) => {
                                        setSelectedItemId(Number(event.target.value));
                                        setSpeechmaticsResult(null);
                                        setError(null);
                                    }}
                                >
                                    {practiceItems.map((item) => (
                                        <MenuItem key={item.id} value={item.id}>
                                            {item.polishText} — {item.englishText}
                                        </MenuItem>
                                    ))}
                                </TextField>

                                {selectedItem && (
                                    <Box textAlign="center">
                                        <Typography variant="h4">
                                            {selectedItem.polishText}
                                        </Typography>

                                        <Typography color="text.secondary">
                                            {selectedItem.englishText}
                                        </Typography>

                                        <Typography variant="body2">
                                            Pronunciation: {selectedItem.phoneticPronunciationText}
                                        </Typography>
                                    </Box>
                                )}
                            </Stack>
                        </Box>
                        {error && (
                            <Typography color="error">
                                {error}
                            </Typography>
                        )}
                        <Box className="recordingPanel">
                            <AudioRecorder onRecordingComplete={handleRecordingComplete}/>
                        </Box>
                        {isTranscribing && (
                            <Box textAlign="center">
                                <CircularProgress/>
                                <Typography>
                                    Processing pronunciation...
                                </Typography>
                            </Box>
                        )}

                        {speechmaticsResult !== null && (
                            <Box
                                component="pre"
                                sx={{
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "anywhere",
                                    maxHeight: 400,
                                    overflow: "auto",
                                    textAlign: "left",
                                }}
                            >
                                {JSON.stringify(speechmaticsResult, null, 2)}
                            </Box>
                        )}
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
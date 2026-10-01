import {
    Box,
    CircularProgress,
    Container,
    Paper,
    Stack,
    Typography
} from "@mui/material";
import {useState} from "react";
import AudioRecorder from "../components/audio_recorder";
import {
    transcribeAudio,
} from "../api/speech_api";

export default function PronunciationPage() {
    const [speechmaticsResult, setSpeechmaticsResult] = useState<unknown>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleRecordingComplete(audio: Blob) {
        try {
            setError(null);
            setSpeechmaticsResult(null);
            setIsTranscribing(true);
            const result = await transcribeAudio(audio);
            setSpeechmaticsResult(result);
        } catch (error) {
            console.error(error);
            setError(error instanceof Error ? error.message : "Transcription failed.");
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

                            <Typography
                                variant="overline"
                                color="text.secondary"
                            >
                                Speechmatics Response
                            </Typography>

                            {isTranscribing ? (

                                <Stack
                                    direction="row"
                                    spacing={2}
                                    alignItems="center"
                                >
                                    <CircularProgress
                                        size={20}
                                    />

                                    <Typography>
                                        Transcribing...
                                    </Typography>
                                </Stack>

                            ) : (

                                <Box
                                    component="pre"
                                    sx={{
                                        whiteSpace: "pre-wrap",
                                        overflowWrap: "anywhere",
                                        textAlign: "left",
                                        maxHeight: 400,
                                        overflow: "auto",
                                    }}
                                >
                                    {speechmaticsResult
                                        ? JSON.stringify(
                                            speechmaticsResult,
                                            null,
                                            2,
                                        )
                                        : "Record something to see the Speechmatics response."}
                                </Box>

                            )}
                        </Box>
                        {error && (
                            <Typography color="error">
                                {error}
                            </Typography>
                        )}
                        <Box className="recordingPanel">
                            <AudioRecorder onRecordingComplete={handleRecordingComplete}/>
                        </Box>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}
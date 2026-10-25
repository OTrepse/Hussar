import {
    Box,
    CircularProgress,
    Container,
    LinearProgress,
    Paper,
    Stack,
    Typography,
    MenuItem,
    TextField,
    Autocomplete,
    Card,
    CardActionArea,
    CardContent, Button
} from "@mui/material";
import AudioRecorder from "../components/audio_recorder";
import AccountControls from "../components/account_controls";
import {
    transcribeAudio,
    type SpeechResponse
} from "../api/speech_api";
import {useEffect, useState} from "react";
import {listPracticeItems} from "../api/practice_items_api";
import type {PracticeItem} from "../types/practice_item";

export default function PronunciationPage() {
    const [speechmaticsResult, setSpeechmaticsResult] = useState<SpeechResponse | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);

    const courses = [...new Set(
        practiceItems.flatMap(item => item.courses)
    )].sort();

    const coursePracticeItems = practiceItems.filter(item =>
        item.courses.includes(selectedCourse ?? "")
    );

    const selectedItem = practiceItems.find(item => item.id === selectedItemId);

    useEffect(() => {
        listPracticeItems()
            .then(items => {
                setPracticeItems(items);
            })
            .catch(error => {
                console.error(error);
                setError("Failed to load practice items.");
            });
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
                        <AccountControls />

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

                        {selectedCourse === null && (
                            <Box>
                                <Typography variant="h5" sx={{mb: 3}}>
                                    Select a Course
                                </Typography>

                                <Box
                                    sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                            xs: "1fr",
                                            sm: "repeat(2, 1fr)",
                                            md: "repeat(3, 1fr)"
                                        },
                                        gap: 2
                                    }}
                                >
                                    {courses.map(course => (
                                        <Card key={course} variant="outlined">
                                            <CardActionArea
                                                onClick={() => {
                                                    setSelectedCourse(course);
                                                    setSelectedItemId(null);
                                                    setSpeechmaticsResult(null);
                                                    setError(null);
                                                }}
                                            >
                                                <CardContent>
                                                    <Typography variant="h5">
                                                        {course}
                                                    </Typography>

                                                    <Typography color="text.secondary">
                                                        {practiceItems.filter(item =>
                                                            item.courses.includes(course)
                                                        ).length} Practice Items
                                                    </Typography>
                                                </CardContent>
                                            </CardActionArea>
                                        </Card>
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {selectedCourse !== null && (
                            <Box className="wordPlaceholder">
                                <Stack spacing={3}>
                                    <Box>
                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                setSelectedCourse(null);
                                                setSelectedItemId(null);
                                                setSpeechmaticsResult(null);
                                                setError(null);
                                            }}
                                        >
                                            Back to Courses
                                        </Button>
                                    </Box>

                                    <Typography variant="h5">
                                        {selectedCourse}
                                    </Typography>

                                    <Autocomplete
                                        fullWidth
                                        options={coursePracticeItems}
                                        value={selectedItem ?? null}
                                        getOptionLabel={item =>
                                            `${item.polishText} — ${item.englishText}`
                                        }
                                        isOptionEqualToValue={(option, value) =>
                                            option.id === value.id
                                        }
                                        onChange={(_, item) => {
                                            setSelectedItemId(item?.id ?? null);
                                            setSpeechmaticsResult(null);
                                            setError(null);
                                        }}
                                        renderInput={params => (
                                            <TextField
                                                {...params}
                                                label="Select Practice Item"
                                                placeholder="Search vocabulary..."
                                            />
                                        )}
                                    />

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

                                            <Typography variant="caption" color="text.secondary">
                                                English translation and pronunciation are approximate.
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Box>
                        )}
                        {selectedCourse !== null && selectedItem !== undefined && (
                            <>
                                <Box className="recordingPanel">
                                    <AudioRecorder
                                        key={selectedItem.id}
                                        onRecordingComplete={handleRecordingComplete}
                                    />
                                </Box>

                                {isTranscribing && (
                                    <Box textAlign="center">
                                        <CircularProgress/>
                                        <Typography>
                                            Processing pronunciation...
                                        </Typography>
                                    </Box>
                                )}

                                {speechmaticsResult?.evaluation && (
                                    <Paper variant="outlined" sx={{p: 3}}>
                                        <Stack spacing={2} alignItems="center">
                                            <Typography variant="h6">
                                                Pronunciation Evaluation
                                            </Typography>

                                            {speechmaticsResult.evaluation.score !== null ? (
                                                <>
                                                    <Typography variant="h2">
                                                        {speechmaticsResult.evaluation.score}%
                                                    </Typography>

                                                    <LinearProgress
                                                        variant="determinate"
                                                        value={speechmaticsResult.evaluation.score}
                                                        sx={{width: "100%", height: 12, borderRadius: 2}}
                                                    />

                                                    <Typography>
                                                        {speechmaticsResult.evaluation.feedback}
                                                    </Typography>

                                                    <Typography variant="caption" color="text.secondary">
                                                        Experimental transcription-match score
                                                    </Typography>
                                                </>
                                            ) : (
                                                <Typography color="text.secondary">
                                                    {speechmaticsResult.evaluation.feedback}
                                                </Typography>
                                            )}
                                        </Stack>
                                    </Paper>
                                )}

                                {speechmaticsResult !== null && (
                                    <Box
                                        component="pre"
                                        sx={{
                                            whiteSpace: "pre-wrap",
                                            overflowWrap: "anywhere",
                                            maxHeight: 400,
                                            overflow: "auto",
                                            textAlign: "left"
                                        }}
                                    >
                                        {JSON.stringify(speechmaticsResult, null, 2)}
                                    </Box>
                                )}
                            </>
                        )}
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}

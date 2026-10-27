import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardActionArea,
    CardContent,
    CircularProgress,
    Container,
    LinearProgress,
    Pagination,
    Paper,
    Stack,
    TextField,
    Typography
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
    const [recordingItemId, setRecordingItemId] = useState<number | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [searchInput, setSearchInput] = useState("");
    const [page, setPage] = useState(1);
    const [activeRecordingId, setActiveRecordingId] = useState<number | null>(null);
    const itemsPerPage = 24;

    const courses = [...new Set(
        practiceItems.flatMap(item => item.courses)
    )].sort();

    const coursePracticeItems = practiceItems
        .filter(item =>
                item.courses.includes(selectedCourse ?? "")
                && (
                    item.polishText.toLocaleLowerCase("pl").includes(searchInput.toLocaleLowerCase("pl"))
                    || item.englishText.toLowerCase().includes(searchInput.toLowerCase())
                )
        )
        .sort((a, b) =>
            sortOrder === "asc"
                ? a.polishText.localeCompare(b.polishText, "pl")
                : b.polishText.localeCompare(a.polishText, "pl")
        );

    const paginatedItems = coursePracticeItems.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

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

    async function handleRecordingComplete(audio: Blob, practiceItemId: number) {
        try {
            setRecordingItemId(practiceItemId);
            setSelectedItemId(practiceItemId);
            setIsTranscribing(true);
            setError(null);
            setSpeechmaticsResult(null);

            const result = await transcribeAudio(audio, practiceItemId);

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
            setActiveRecordingId(null);
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

                        {error && recordingItemId === null && (
                            <Typography color="error">
                                {error}
                            </Typography>
                        )}

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
                                                disabled={activeRecordingId !== null || isTranscribing}
                                                onClick={() => {
                                                    setSelectedCourse(course);
                                                    setSelectedItemId(null);
                                                    setRecordingItemId(null);
                                                    setSpeechmaticsResult(null);
                                                    setError(null);
                                                    setSearchInput("");
                                                    setSortOrder("asc");
                                                    setPage(1);
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
                                            disabled={activeRecordingId !== null || isTranscribing}
                                            onClick={() => {
                                                setSelectedCourse(null);
                                                setSelectedItemId(null);
                                                setRecordingItemId(null);
                                                setActiveRecordingId(null);
                                                setIsTranscribing(false);
                                                setSpeechmaticsResult(null);
                                                setError(null);
                                                setSearchInput("");
                                                setSortOrder("asc");
                                                setPage(1);
                                            }}
                                        >
                                            Back to Courses
                                        </Button>
                                    </Box>

                                    <Typography variant="h5">
                                        {selectedCourse}
                                    </Typography>

                                    <Typography variant="caption" color="text.secondary">
                                        English translations and phonetic pronunciations are approximate.
                                    </Typography>

                                    <Stack
                                        direction={{xs: "column", sm: "row"}}
                                        spacing={2}
                                        alignItems="center"
                                    >
                                        <Autocomplete
                                            fullWidth
                                            options={coursePracticeItems}
                                            value={practiceItems.find(item => item.id === selectedItemId) ?? null}
                                            inputValue={searchInput}
                                            onInputChange={(_, value, reason) => {
                                                if (reason === "input" || reason === "clear") {
                                                    setSearchInput(value);
                                                    setPage(1);
                                                }
                                            }}
                                            getOptionLabel={item =>
                                                `${item.polishText} — ${item.englishText}`
                                            }
                                            isOptionEqualToValue={(option, value) =>
                                                option.id === value.id
                                            }
                                            onChange={(_, item) => {
                                                setSelectedItemId(item?.id ?? null);
                                                setRecordingItemId(item?.id ?? null);
                                                setSpeechmaticsResult(null);
                                                setError(null);

                                                if (item) {
                                                    setSearchInput(item.polishText);
                                                }
                                            }}
                                            renderInput={params => (
                                                <TextField
                                                    {...params}
                                                    label="Search Vocabulary"
                                                    placeholder="Search Polish or English..."
                                                />
                                            )}
                                        />

                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                setSortOrder(previous =>
                                                    previous === "asc" ? "desc" : "asc"
                                                );
                                                setPage(1);
                                            }}
                                            sx={{
                                                minWidth: 125,
                                                height: 56,
                                                flexShrink: 0
                                            }}
                                        >
                                            {sortOrder === "asc" ? "A–Z ↑" : "Z–A ↓"}
                                        </Button>
                                    </Stack>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: 2
                                        }}
                                    >
                                        {paginatedItems.map(item => (
                                            <Card
                                                key={item.id}
                                                variant="outlined"
                                                sx={{
                                                    width: "100%",
                                                    borderRadius: 2,
                                                    borderColor: selectedItemId === item.id
                                                        ? "primary.main"
                                                        : "divider",
                                                    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                                                    "&:hover": {
                                                        boxShadow: 2
                                                    }
                                                }}
                                            >
                                                <CardContent
                                                    sx={{
                                                        p: {xs: 2, sm: 3},
                                                        "&:last-child": {pb: {xs: 2, sm: 3}}
                                                    }}
                                                >
                                                    <Stack spacing={2}>
                                                        <Box
                                                            sx={{
                                                                display: "flex",
                                                                flexDirection: {
                                                                    xs: "column",
                                                                    sm: "row"
                                                                },
                                                                alignItems: {
                                                                    xs: "stretch",
                                                                    sm: "center"
                                                                },
                                                                justifyContent: "space-between",
                                                                gap: 2
                                                            }}
                                                        >
                                                            <Box sx={{flex: 1, minWidth: 0}}>
                                                                <Typography variant="h6">
                                                                    {item.polishText}
                                                                </Typography>

                                                                <Typography
                                                                    variant="body1"
                                                                    color="text.secondary"
                                                                >
                                                                    {item.englishText}
                                                                </Typography>

                                                                {item.phoneticPronunciationText && (
                                                                    <Typography
                                                                        variant="body2"
                                                                        color="text.secondary"
                                                                        sx={{mt: 1}}
                                                                    >
                                                                        {item.phoneticPronunciationText}
                                                                    </Typography>
                                                                )}
                                                            </Box>

                                                            <Box
                                                                sx={{
                                                                    flexShrink: 0,
                                                                    alignSelf: {
                                                                        xs: "stretch",
                                                                        sm: "center"
                                                                    },
                                                                    "& button": {
                                                                        width: {
                                                                            xs: "100%",
                                                                            sm: "auto"
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                <AudioRecorder
                                                                    disabled={
                                                                        activeRecordingId !== null
                                                                        && activeRecordingId !== item.id
                                                                        || isTranscribing
                                                                    }
                                                                    onRecordingStart={() => {
                                                                        setActiveRecordingId(item.id);
                                                                        setRecordingItemId(item.id);
                                                                        setSelectedItemId(item.id);
                                                                        setSpeechmaticsResult(null);
                                                                        setError(null);
                                                                    }}
                                                                    onRecordingError={() => {
                                                                        setActiveRecordingId(current =>
                                                                            current === item.id ? null : current
                                                                        );
                                                                    }}
                                                                    onRecordingComplete={audio =>
                                                                        handleRecordingComplete(audio, item.id)
                                                                    }
                                                                />
                                                            </Box>
                                                        </Box>

                                                        {recordingItemId === item.id && isTranscribing && (
                                                            <Stack
                                                                direction="row"
                                                                spacing={2}
                                                                alignItems="center"
                                                            >
                                                                <CircularProgress size={20}/>

                                                                <Typography variant="body2">
                                                                    Evaluating pronunciation...
                                                                </Typography>
                                                            </Stack>
                                                        )}

                                                        {recordingItemId === item.id && speechmaticsResult?.evaluation && (
                                                            <Box
                                                                sx={{
                                                                    pt: 2,
                                                                    borderTop: 1,
                                                                    borderColor: "divider"
                                                                }}
                                                            >
                                                                <Stack spacing={2}>
                                                                    <Box
                                                                        sx={{
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: 2,
                                                                            flexWrap: "wrap"
                                                                        }}
                                                                    >
                                                                        <Typography variant="h4">
                                                                            {speechmaticsResult.evaluation.score !== null
                                                                                ? `${speechmaticsResult.evaluation.score}%`
                                                                                : "N/A"
                                                                            }
                                                                        </Typography>

                                                                        <Typography variant="body2">
                                                                            {speechmaticsResult.evaluation.feedback}
                                                                        </Typography>
                                                                    </Box>

                                                                    {speechmaticsResult.evaluation.score !== null && (
                                                                        <LinearProgress
                                                                            variant="determinate"
                                                                            value={speechmaticsResult.evaluation.score}
                                                                            sx={{
                                                                                height: 8,
                                                                                borderRadius: 2
                                                                            }}
                                                                        />
                                                                    )}

                                                                    <Typography
                                                                        variant="caption"
                                                                        color="text.secondary"
                                                                    >
                                                                        Experimental transcription-match score
                                                                    </Typography>
                                                                </Stack>
                                                            </Box>
                                                        )}

                                                        {recordingItemId === item.id && error && (
                                                            <Typography color="error" variant="body2">
                                                                {error}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                    {coursePracticeItems.length > itemsPerPage && (
                                        <Box
                                            display="flex"
                                            justifyContent="center"
                                            mt={3}
                                        >
                                            <Pagination
                                                count={Math.ceil(coursePracticeItems.length / itemsPerPage)}
                                                page={page}
                                                onChange={(_, value) => setPage(value)}
                                                color="primary"
                                            />
                                        </Box>
                                    )}
                                </Stack>
                            </Box>
                        )}
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
}

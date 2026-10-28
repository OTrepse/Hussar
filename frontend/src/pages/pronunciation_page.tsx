import {
    Alert,
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
import VolumeUpRoundedIcon from "@mui/icons-material/VolumeUpRounded";
import StopRoundedIcon from "@mui/icons-material/StopRounded";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import usePolishSpeech from "../hooks/use_polish_speech";
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
    const [isLoadingItems, setIsLoadingItems] = useState(true);
    const { supported, speakingItemId, speakPolish, cancelSpeech, speechNotice, speechError } = usePolishSpeech();
    const practiceIsBusy = activeRecordingId !== null || isTranscribing;
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
        let active = true;
        listPracticeItems()
            .then(items => {
                if (active) setPracticeItems(items);
            })
            .catch(error => {
                console.error(error);
                if (active) setError("Failed to load practice items.");
            })
            .finally(() => { if (active) setIsLoadingItems(false); });
        return () => { active = false; };
    }, []);

    useEffect(() => {
        cancelSpeech();
    }, [selectedCourse, page, searchInput, cancelSpeech]);

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
        <Box className="practiceShell">

            <Container
                maxWidth="lg"
                className="workspace"
            >

                <Paper
                    className="pronunciationPanel coursesPanel"
                    elevation={0}
                >

                    <Stack spacing={3}>
                        <Box>
                            <Typography className="eyebrow">A LITTLE PRACTICE, EVERY DAY</Typography>
                            <Typography
                                variant="h4"
                                component="h1"
                            >
                                {selectedCourse ? "Let's practice Polish." : "Your next word awaits."}
                            </Typography>

                            <Typography color="text.secondary" sx={{ mt: 1 }}>
                                Choose a course. Listen closely, record your voice, and keep growing.
                            </Typography>
                        </Box>

                        {error && recordingItemId === null && (
                            <Typography color="error" role="alert">
                                {error}
                            </Typography>
                        )}

                        {isLoadingItems && <Stack direction="row" spacing={2} alignItems="center" role="status"><CircularProgress size={22} aria-label="Loading courses" /><Typography>Loading your courses...</Typography></Stack>}
                        {!isLoadingItems && !error && courses.length === 0 && <Alert severity="info">No course vocabulary is available yet. Please check back later.</Alert>}

                        {selectedCourse === null && (
                            <Box>
                                <Typography variant="h5" component="h2" sx={{mb: 3}}>
                                    Explore your courses
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
                                        <Card key={course} variant="outlined" className="courseCard">
                                            <CardActionArea
                                                aria-label={`Practice ${course}`}
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
                                                    <span className="courseIcon"><AutoStoriesOutlinedIcon /></span>
                                                    <Typography variant="h5" component="h3">
                                                        {course}
                                                    </Typography>
                                                    <Typography color="text.secondary">
                                                        {practiceItems.filter(item =>
                                                            item.courses.includes(course)
                                                        ).length} Practice Items
                                                    </Typography>
                                                    <Typography className="courseCardLink">Start practicing <ArrowForwardRoundedIcon fontSize="small" /></Typography>
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

                                    <Typography variant="h5" component="h2">
                                        {selectedCourse}
                                    </Typography>

                                    <Typography variant="caption" color="text.secondary">
                                        English translations and phonetic pronunciations are approximate.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">Listen with your browser's voice, then record the word. Stop recording to analyze your pronunciation.</Typography>
                                    {speechNotice && <Alert severity={speechError ? "warning" : "info"}>{speechNotice}</Alert>}

                                    <Stack
                                        direction={{xs: "column", sm: "row"}}
                                        spacing={2}
                                        alignItems="center"
                                    >
                                        <Autocomplete
                                            disabled={practiceIsBusy}
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
                                            disabled={practiceIsBusy}
                                            aria-label={sortOrder === "asc" ? "Sort words Z to A" : "Sort words A to Z"}
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
                                        {coursePracticeItems.length === 0 && <Alert severity="info">No matching words. Try a different Polish or English search.</Alert>}
                                        {paginatedItems.map(item => (
                                            <Card
                                                key={item.id}
                                                className="practiceCard"
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
                                                                {selectedItemId === item.id && <Typography variant="caption" color="secondary" sx={{ fontWeight: 700 }}>Selected word</Typography>}
                                                                <Typography variant="h6" component="h3" lang="pl">
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
                                                                className="practiceActions"
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
                                                                <Button
                                                                    variant="outlined"
                                                                    startIcon={speakingItemId === item.id ? <StopRoundedIcon /> : <VolumeUpRoundedIcon />}
                                                                    disabled={!supported || practiceIsBusy}
                                                                    aria-label={speakingItemId === item.id ? `Stop listening to ${item.polishText}` : `Listen to the Polish pronunciation of ${item.polishText}`}
                                                                    aria-pressed={speakingItemId === item.id}
                                                                    onClick={() => speakingItemId === item.id ? cancelSpeech() : speakPolish(item.polishText, item.id)}
                                                                >
                                                                    {speakingItemId === item.id ? "Stop audio" : "Listen"}
                                                                </Button>
                                                                <AudioRecorder
                                                                    word={item.polishText}
                                                                    onBeforeRecording={() => {
                                                                        cancelSpeech();
                                                                        setActiveRecordingId(item.id);
                                                                    }}
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
                                                                role="status"
                                                                direction="row"
                                                                spacing={2}
                                                                alignItems="center"
                                                            >
                                                                <CircularProgress size={20} aria-label={`Analyzing ${item.polishText}`}/>

                                                                <Typography variant="body2">
                                                                    Evaluating pronunciation...
                                                                </Typography>
                                                            </Stack>
                                                        )}

                                                        {recordingItemId === item.id && speechmaticsResult?.evaluation && (
                                                            <Box
                                                                role="status"
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
                                                                            aria-label={`Pronunciation match for ${item.polishText}`}
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
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Standard match: {speechmaticsResult.evaluation.standardScore === null ? "N/A" : `${speechmaticsResult.evaluation.standardScore}%`}
                                                                        {" · "}Contextual match: {speechmaticsResult.evaluation.contextualScore === null ? "N/A" : `${speechmaticsResult.evaluation.contextualScore}%`}
                                                                    </Typography>
                                                                </Stack>
                                                            </Box>
                                                        )}

                                                        {recordingItemId === item.id && error && (
                                                            <Typography color="error" variant="body2" role="alert">
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
                                                disabled={practiceIsBusy}
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

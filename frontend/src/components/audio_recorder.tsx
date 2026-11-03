import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";

import {
    Button,
    Stack,
    Typography,
} from "@mui/material";

import {
    useEffect,
    useRef,
    useState,
} from "react";

interface AudioRecorderProps {
    onRecordingComplete?: (audio: Blob) => void;
    onRecordingStart?: () => void;
    onRecordingError?: () => void;
    onBeforeRecording?: () => void;
    word?: string;
    disabled?: boolean;
}

const preferredAudioMimeTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mpeg",
];

function getSupportedAudioMimeType(): string {
    if (!("MediaRecorder" in window)) {
        return "";
    }

    return (
        preferredAudioMimeTypes.find((mimeType) =>
            MediaRecorder.isTypeSupported(mimeType),
        ) ?? ""
    );
}

export default function AudioRecorder({
                                          onRecordingComplete,
                                          onRecordingStart,
                                          onRecordingError,
                                          onBeforeRecording,
                                          word,
                                          disabled = false
                                      }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [recorderError, setRecorderError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            stopActiveStream();
        };
    }, []);

    function stopActiveStream() {
        streamRef.current
            ?.getTracks()
            .forEach((track) => {
                track.stop();
            });
        streamRef.current = null;
    }

    async function startRecording() {
        if (isRecording || isStarting || disabled) {
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
            setRecorderError("Audio recording is not available in this browser.");
            return;
        }

        try {
            setRecorderError(null);
            setIsStarting(true);
            onBeforeRecording?.();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!mountedRef.current) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }
            const mimeType = getSupportedAudioMimeType();
            const recorder = new MediaRecorder(
                stream,
                mimeType ? {mimeType} : undefined,
            );
            audioChunksRef.current = [];
            streamRef.current = stream;
            mediaRecorderRef.current = recorder;

            recorder.addEventListener(
                "dataavailable",
                (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(
                            event.data,
                        );
                    }
                },
            );

            recorder.addEventListener(
                "error",
                () => {
                    setRecorderError(
                        "Recording stopped because the browser hit an audio error.",
                    );
                    stopRecording();
                },
            );

            recorder.addEventListener(
                "stop",
                () => {
                    if (!mountedRef.current) return;
                    const audioBlob = new Blob(
                        audioChunksRef.current,
                        {
                            type:
                                recorder.mimeType
                                || "audio/webm",
                        },
                    );

                    audioChunksRef.current = [];
                    mediaRecorderRef.current = null;
                    setIsRecording(false);
                    stopActiveStream();

                    if (audioBlob.size > 0) {
                        onRecordingComplete?.(audioBlob);
                    } else {
                        onRecordingError?.();
                    }
                },
            );

            recorder.start();
            onRecordingStart?.();
            setIsRecording(true);

        } catch {
            setRecorderError(
                "Microphone access was blocked or unavailable.",
            );
            onRecordingError?.();
            setIsRecording(false);
            stopActiveStream();
        } finally {
            if (mountedRef.current) setIsStarting(false);
        }
    }

    function stopRecording() {
        const recorder = mediaRecorderRef.current;

        if (!recorder || recorder.state === "inactive") {
            return;
        }
        recorder.stop();
        setIsRecording(false);
    }

    function handleRecordButtonClick() {
        if (isRecording) {
            stopRecording();
            return;
        }
        void startRecording();
    }

    return (
        <Stack spacing={1}>
            <Button
                variant={isRecording ? "outlined" : "contained"}
                disabled={disabled || isStarting}
                aria-label={`${isRecording ? "Stop recording" : "Record"}${word ? ` ${word}` : " your voice"}`}
                aria-pressed={isRecording}
                color={isRecording ? "error" : "primary"}
                startIcon={isStarting ? undefined : isRecording ? <StopIcon /> : <MicIcon />}
                onClick={handleRecordButtonClick}
            >
                {isStarting ? "Opening..." : isRecording ? "Stop" : "Record"}
            </Button>

            {recorderError && (
                <Typography color="error" role="alert">
                    {recorderError}
                </Typography>
            )}
        </Stack>
    );
}

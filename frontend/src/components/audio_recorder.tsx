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

export default function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recorderError, setRecorderError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);

    useEffect(() => {
        return () => {
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
        if (isRecording) {
            return;
        }

        if (!navigator.mediaDevices?.getUserMedia || !("MediaRecorder" in window)) {
            setRecorderError("Audio recording is not available in this browser.");
            return;
        }

        try {
            setRecorderError(null);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
                        onRecordingComplete?.(
                            audioBlob,
                        );
                    }
                },
            );

            recorder.start();
            setIsRecording(true);

        } catch {
            setRecorderError(
                "Microphone access was blocked or unavailable.",
            );
            setIsRecording(false);
            stopActiveStream();
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
                color={isRecording ? "error" : "primary"}
                startIcon={isRecording ? <StopIcon /> : <MicIcon />}
                onClick={handleRecordButtonClick}
            >
                {isRecording ? "Stop Recording" : "Record Voice"}
            </Button>

            {recorderError && (
                <Typography color="error">
                    {recorderError}
                </Typography>
            )}
        </Stack>
    );
}
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";

type BackendStashedAudio = {
  id: string;
  originalFilename: string;
  storedFilename: string;
  relativePath: string;
  contentType: string;
  size: number;
  createdAt: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const preferredAudioMimeTypes = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
];

function getSupportedAudioMimeType() {
  if (!("MediaRecorder" in window)) {
    return "";
  }

  return (
    preferredAudioMimeTypes.find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType),
    ) ?? ""
  );
}

function getAudioFileExtension(mimeType: string) {
  if (mimeType.includes("mp4")) {
    return "m4a";
  }

  if (mimeType.includes("mpeg")) {
    return "mp3";
  }

  return "webm";
}

async function uploadAudioFile(file: File): Promise<BackendStashedAudio> {
  const response = await fetch(`${API_BASE_URL}/api/audio-stash`, {
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "X-Audio-Filename": file.name,
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Audio upload failed with status ${response.status}`);
  }

  return response.json() as Promise<BackendStashedAudio>;
}

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recorderError, setRecorderError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, []);

  function stopActiveStream() {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;
  }

  async function stashRecording(blob: Blob) {
    if (blob.size === 0) {
      return;
    }

    const createdAt = new Date();
    const extension = getAudioFileExtension(blob.type);
    const timestamp = createdAt.toISOString().replace(/[:.]/g, "-");
    const file = new File([blob], `pronunciation-${timestamp}.${extension}`, {
      type: blob.type,
    });

    try {
      await uploadAudioFile(file);
    } catch {
      setRecorderError("Recording could not be saved. Make sure the backend is running.");
    }
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

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mimeType = getSupportedAudioMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      audioChunksRef.current = [];
      streamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("error", () => {
        setRecorderError("Recording stopped because the browser hit an audio error.");
        stopRecording();
      });

      recorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        void stashRecording(audioBlob);
        audioChunksRef.current = [];
        mediaRecorderRef.current = null;
        setIsRecording(false);
        stopActiveStream();
      });

      recorder.start();
      setIsRecording(true);
    } catch {
      setRecorderError("Microphone access was blocked or unavailable.");
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
    <Box className="appShell">
      <Container maxWidth="md" className="workspace">
        <Paper className="pronunciationPanel" elevation={0}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" component="h1">
                Pronunciation Check
              </Typography>
              <Typography>
                Polish word and scoring data
              </Typography>
            </Box>

            <Box className="wordPlaceholder">
              <Typography variant="overline" color="text.secondary">
                Polish Word
              </Typography>
              <Typography className="targetWord" color="text.secondary">


                 {/* this is where the word will go from the backend */}


              </Typography>
            </Box>

            <TextField
              label="Transcript"
              placeholder="Transcript from speech recognition will appear here"
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              fullWidth
            />

            <Button variant="contained">
              Check Pronunciation
            </Button>

            <Box className="recordingPanel">
              <Button
                variant={isRecording ? "outlined" : "contained"}
                color={isRecording ? "error" : "primary"}
                startIcon={isRecording ? <StopIcon /> : <MicIcon />}
                onClick={handleRecordButtonClick}
              >
                {isRecording ? "Stop Recording" : "Record Voice"}
              </Button>

              {recorderError ? (
                <Typography color="error" className="recordingError">
                  {recorderError}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

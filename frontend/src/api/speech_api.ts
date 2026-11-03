// GETS BACKEND URL
const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:8080"
).replace(/\/+$/, "");

export interface PronunciationEvaluation {
    score: number | null;
    standardScore: number | null;
    contextualScore: number | null;
    feedback: string;
}

export interface SpeechResponse {
    expectedText: string;
    evaluation: PronunciationEvaluation;
    results: unknown[];
}

export async function transcribeAudio(audio: Blob, practiceItemId: number): Promise<SpeechResponse> {
    // FORMAT DATA TO SEND TO BACKEND
    const formData = new FormData();
    formData.append("audio", audio, "pronunciation.webm");
    formData.append("practiceItemId", String(practiceItemId));

    // BACKEND URL HIT
    const response = await fetch(
        `${API_BASE_URL}/api/speech/transcribe`,
        {
            method: "POST",
            body: formData,
        }
    );
    // THROW ERROR
    if (!response.ok) {
        const error = await response.text();
        throw new Error(
            `Transcription failed (${response.status}): ${error}`,
        );
    }
    // IF NOT ERROR RETURN SUCCESSFUL RESPONSE
    return response.json();
}
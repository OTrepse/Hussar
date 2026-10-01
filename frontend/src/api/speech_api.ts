// GETS BACKEND URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";


export async function transcribeAudio(audio: Blob): Promise<unknown> {
    // FORMAT DATA TO SEND TO BACKEND
    const formData = new FormData();
    formData.append(
        "audio",
        audio,
        "pronunciation.webm",
    );

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
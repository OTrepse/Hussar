export interface SpeechAlternative {
    content: string;
    confidence: number;
}

export interface SpeechWord {
    content: string;
    confidence: number;
    alternatives: SpeechAlternative[];
}

export interface SpeechTranscriptionResponse {
    transcript: string;
    words: SpeechWord[];
}
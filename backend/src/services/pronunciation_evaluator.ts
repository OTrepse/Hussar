export interface TranscriptionJobResult {
    type: string;
    status: string;
    transcript?: unknown;
    error?: string;
}

export interface PronunciationEvaluation {
    score: number | null;
    standardScore: number | null;
    contextualScore: number | null;
    feedback: string;
}

export class PronunciationEvaluator {

    private static normalize(text: string): string {
        return text
            .normalize("NFC")
            .toLocaleLowerCase("pl")
            .replace(/[^\p{L}\p{N}\s]/gu, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    private static getTranscript(data: unknown): string | null {
        if (!data || typeof data !== "object") {
            return null;
        }

        const transcript = data as {
            results?: {
                type: string;
                alternatives?: {
                    content: string;
                }[];
            }[];
        };

        if (!Array.isArray(transcript.results)) {
            return null;
        }

        const words = transcript.results
            .filter(result => result.type === "word")
            .map(result => result.alternatives?.[0]?.content ?? "")
            .filter(Boolean);

        return words.length > 0 ? words.join(" ") : null;
    }

    private static calculateDistance(a: string, b: string): number {
        const previous = Array.from(
            {length: b.length + 1},
            (_, index) => index
        );

        for (let i = 1; i <= a.length; i++) {
            const current = [i];

            for (let j = 1; j <= b.length; j++) {
                current[j] = Math.min(
                    current[j - 1] + 1,
                    previous[j] + 1,
                    previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
                );
            }

            previous.splice(0, previous.length, ...current);
        }

        return previous[b.length];
    }

    private static calculateScore(
        expectedText: string,
        recognizedText: string | null
    ): number | null {
        if (!recognizedText) {
            return null;
        }

        const expected = this.normalize(expectedText);
        const recognized = this.normalize(recognizedText);

        if (!expected || !recognized) {
            return null;
        }

        const distance = this.calculateDistance(expected, recognized);
        const length = Math.max(expected.length, recognized.length);

        return Math.round(
            Math.max(0, 1 - distance / length) * 100
        );
    }

    public static evaluate(
        expectedText: string,
        results: TranscriptionJobResult[]
    ): PronunciationEvaluation {

        const standard = results.find(result =>
            result.type === "standard" && result.status === "fulfilled"
        );

        const contextual = results.find(result =>
            result.type === "enhanced_contextual" && result.status === "fulfilled"
        );

        const standardScore = this.calculateScore(
            expectedText,
            this.getTranscript(standard?.transcript)
        );

        const contextualScore = this.calculateScore(
            expectedText,
            this.getTranscript(contextual?.transcript)
        );

        const scores = [
            {score: standardScore, weight: 0.75},
            {score: contextualScore, weight: 0.25},
        ].filter(
            (result): result is {score: number; weight: number} =>
                result.score !== null
        );

        if (scores.length === 0) {
            return {
                score: null,
                standardScore,
                contextualScore,
                feedback: "Unable to evaluate recording.",
            };
        }

        const totalWeight = scores.reduce(
            (total, result) => total + result.weight, 0
        );

        const score = Math.round(
            scores.reduce(
                (total, result) => total + result.score * result.weight, 0
            ) / totalWeight
        );

        return {
            score,
            standardScore,
            contextualScore,
            feedback: score >= 90
                ? "Excellent match!"
                : score >= 70
                    ? "Good match. Keep practicing!"
                    : score >= 50
                        ? "Getting closer. Try again."
                        : "Try listening and repeating the word.",
        };
    }
}
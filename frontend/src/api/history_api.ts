import { supabase } from "./supabase_client";
import type { SpeechResponse } from "./speech_api";

export interface PronunciationHistoryEntry {
    id: string;
    user_id: string;
    word_id: number;
    word_text: string;
    score: number;
    feedback: string | null;
    standard_score: number | null;
    contextual_score: number | null;
    attempted_at: string;
}

const columns = "id,user_id,word_id,word_text,score,feedback,standard_score,contextual_score,attempted_at";
let lastCompletedAt = 0;

function isScore(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

export async function savePronunciationHistory(
    userId: string | undefined,
    wordId: number,
    result: SpeechResponse,
): Promise<void> {
    // Null scores mean the existing evaluator could not evaluate the recording.
    if (!userId || !Number.isSafeInteger(wordId) || wordId <= 0
        || typeof result?.expectedText !== "string" || !result.expectedText.trim()
        || !isScore(result.evaluation?.score)) return;

    // Capture completion before any asynchronous work. Distinguish completions in
    // the same millisecond, including when the device clock moves backwards.
    lastCompletedAt = Math.max(Date.now(), lastCompletedAt + 1);
    const attemptedAt = new Date(lastCompletedAt).toISOString();

    if (!supabase) throw new Error("History storage is not configured.");
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    // A response from a previous account must never be saved to the new account.
    if (data.session?.user.id !== userId) return;

    const { error } = await supabase.from("pronunciation_history").upsert({
        user_id: userId,
        word_id: wordId,
        word_text: result.expectedText,
        score: result.evaluation.score,
        feedback: typeof result.evaluation.feedback === "string" ? result.evaluation.feedback : null,
        standard_score: isScore(result.evaluation.standardScore) ? result.evaluation.standardScore : null,
        contextual_score: isScore(result.evaluation.contextualScore) ? result.evaluation.contextualScore : null,
        attempted_at: attemptedAt,
    }, { onConflict: "user_id,word_id" });

    if (error) throw error;
    window.dispatchEvent(new Event("pronunciation-history-saved"));
}

export async function listPronunciationHistory(userId: string): Promise<PronunciationHistoryEntry[]> {
    if (!supabase) throw new Error("History storage is not configured.");

    // Page through Supabase's response limit so practiced words are never hidden.
    const entries: PronunciationHistoryEntry[] = [];
    const pageSize = 1000;
    for (let offset = 0; ; ) {
        const { data, count, error } = await supabase.from("pronunciation_history")
            .select(columns, { count: "exact" })
            .eq("user_id", userId)
            .order("attempted_at", { ascending: false })
            .order("word_id", { ascending: true })
            .range(offset, offset + pageSize - 1);

        if (error) throw error;
        entries.push(...(data ?? []) as PronunciationHistoryEntry[]);
        if (!data?.length || (count !== null && entries.length >= count)) return entries;
        offset += data.length;
    }
}

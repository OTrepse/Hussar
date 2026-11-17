import { useEffect, useRef, useState } from "react";
import { savePronunciationHistory } from "../api/history_api";
import type { SpeechResponse } from "../api/speech_api";
import { useAuth } from "../components/auth_provider";

export default function usePronunciationHistory() {
    const { session } = useAuth();
    const userId = session?.user.id;
    const mounted = useRef(true);
    const latestSave = useRef(0);
    const [saveError, setSaveError] = useState<{ userId: string; message: string } | null>(null);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    function saveHistory(wordId: number, result: SpeechResponse) {
        const saveNumber = ++latestSave.current;
        setSaveError(null);
        // Do not await: results and recording controls retain their existing behavior.
        void savePronunciationHistory(userId, wordId, result).catch(() => {
            if (mounted.current && saveNumber === latestSave.current && userId) setSaveError({
                userId,
                message: "Your pronunciation result is ready, but this attempt could not be saved to History. Please check your connection and practice again to save a new result.",
            });
        });
    }

    return {
        saveHistory,
        historySaveError: saveError && saveError.userId === userId ? saveError.message : null,
        dismissHistorySaveError: () => setSaveError(null),
    };
}

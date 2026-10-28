import { useCallback, useEffect, useRef, useState } from "react";

export default function usePolishSpeech() {
    const supported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [speakingItemId, setSpeakingItemId] = useState<number | null>(null);
    const [hasPolishVoice, setHasPolishVoice] = useState<boolean | null>(null);
    const [speechError, setSpeechError] = useState<string | null>(null);

    const cancelSpeech = useCallback(() => {
        utteranceRef.current = null;
        if (supported) window.speechSynthesis.cancel();
        setSpeakingItemId(null);
    }, [supported]);

    useEffect(() => {
        if (!supported) return;
        const synthesis = window.speechSynthesis;
        const loadVoices = () => {
            voicesRef.current = synthesis.getVoices();
            if (voicesRef.current.length) {
                setHasPolishVoice(voicesRef.current.some(voice => /^pl(?:[-_]|$)/i.test(voice.lang)));
            }
        };
        loadVoices();
        synthesis.addEventListener?.("voiceschanged", loadVoices);
        // Some engines return an empty list without ever dispatching voiceschanged.
        const voiceTimer = window.setTimeout(() => {
            loadVoices();
            setHasPolishVoice(voicesRef.current.some(voice => /^pl(?:[-_]|$)/i.test(voice.lang)));
        }, 1500);
        const onVisibilityChange = () => { if (document.hidden) cancelSpeech(); };
        document.addEventListener("visibilitychange", onVisibilityChange);
        window.addEventListener("pagehide", cancelSpeech);
        return () => {
            clearTimeout(voiceTimer);
            synthesis.removeEventListener?.("voiceschanged", loadVoices);
            document.removeEventListener("visibilitychange", onVisibilityChange);
            window.removeEventListener("pagehide", cancelSpeech);
            utteranceRef.current = null;
            synthesis.cancel();
        };
    }, [supported, cancelSpeech]);

    const speakPolish = useCallback((word: string, itemId: number) => {
        if (!supported || !word.trim()) return;
        cancelSpeech();
        setSpeechError(null);
        const synthesis = window.speechSynthesis;
        const voices = synthesis.getVoices();
        voicesRef.current = voices;
        const polishVoice = voices.find(voice => voice.lang.toLowerCase() === "pl-pl")
            ?? voices.find(voice => /^pl(?:[-_]|$)/i.test(voice.lang));
        setHasPolishVoice(Boolean(polishVoice));
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = "pl-PL";
        utterance.rate = 0.85;
        if (polishVoice) utterance.voice = polishVoice;
        utteranceRef.current = utterance;
        setSpeakingItemId(itemId);
        const finish = () => {
            if (utteranceRef.current !== utterance) return;
            utteranceRef.current = null;
            setSpeakingItemId(null);
        };
        utterance.onend = finish;
        utterance.onerror = event => {
            if (utteranceRef.current !== utterance) return;
            finish();
            if (event.error === "canceled" || event.error === "interrupted") return;
            setSpeechError(event.error === "language-unavailable" || event.error === "voice-unavailable"
                ? "A Polish voice isn't available. Add a Polish speech voice in your device settings, then reload to try again."
                : "Audio couldn't play. Check your device's sound and browser speech settings, then try Listen again.");
        };
        try {
            synthesis.speak(utterance);
        } catch {
            finish();
            setSpeechError("Your browser couldn't play this pronunciation. You can still record and practice.");
        }
    }, [supported, cancelSpeech]);

    const speechNotice = !supported
        ? "Listening isn't supported in this browser. You can still record and practice."
        : speechError ?? (hasPolishVoice === false
            ? "No Polish voice is listed on this device. The browser may use a fallback, so pronunciation may be inaccurate. Add a Polish speech voice in your device settings for better results."
            : null);

    return { supported, speakingItemId, speakPolish, cancelSpeech, speechNotice, speechError };
}

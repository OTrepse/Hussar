import type {PracticeItem} from "../types/practice_item";

const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ??
    "http://localhost:8080";

export async function listPracticeItems(): Promise<PracticeItem[]> {
    const response = await fetch(
        `${API_BASE_URL}/api/practice-items`
    );

    if (!response.ok) {
        throw new Error("Failed to load practice items");
    }

    return response.json();
}
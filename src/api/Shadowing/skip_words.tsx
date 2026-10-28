import { apiFetch } from "@/lib/auth";
const API_BASE_URL= import.meta.env.VITE_API_BASE_URL;
type SkipWordsType = "skipWithPreviousLines" | "skipWithNextLines" | "skipOnlyCurrentLine";

export async function getSkipWords() {
    const response = await apiFetch(
        `${API_BASE_URL}/config/video_subtitle_skip_words`
    );

    if (!response.ok) {
        throw new Error("Failed to load SkipWordsList");
    }

    return response.json();
}

async function postSkipWords(url: string, type: SkipWordsType, word: string) {
    const response = await apiFetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            type,
            word
        })
    });

    if (!response.ok) {
        throw new Error("Request failed");
    }

    return response.json();
}

export async function addSkipWords(type: SkipWordsType, word: string) {
    return postSkipWords(`${API_BASE_URL}/config/video_subtitle_skip_words/add`, type, word);
}
export async function deleteSkipWords(type: SkipWordsType, word: string) {
    return postSkipWords(`${API_BASE_URL}/config/video_subtitle_skip_words/delete`, type, word);
}
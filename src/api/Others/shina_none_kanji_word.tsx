const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type ShinaNoneKanjiWord = {
    id: number;
    word: string;
    ruby: string;
    meaning: string | null;
    created_at: string;
};

export type ShinaNoneKanjiWordChanges = Omit<ShinaNoneKanjiWord, "id" | "created_at">;

export async function getShinaNoneKanjiWord(): Promise<ShinaNoneKanjiWord[]> {
    const response = await fetch(`${API_BASE_URL}/fetch_kanji_word`);
    if (!response.ok) throw new Error("Failed to load ShinaNoneKanjiWord");
    return response.json();
}

async function postShinaNoneKanjiWord<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("shinaNoneKanjiWord request failed");
    if (response.status === 204) return {} as T;
    return response.json();
}

export async function updateShinaNoneKanjiWord(id: number, changes: ShinaNoneKanjiWordChanges): Promise<Partial<ShinaNoneKanjiWord>> {
    return postShinaNoneKanjiWord<Partial<ShinaNoneKanjiWord>>(`${API_BASE_URL}/update_kanji_word`, {id, ...changes});
}

export async function addShinaNoneKanjiWord(changes: ShinaNoneKanjiWordChanges): Promise<Partial<ShinaNoneKanjiWord>> {
    return postShinaNoneKanjiWord<Partial<ShinaNoneKanjiWord>>(`${API_BASE_URL}/add_kanji_word`, changes);
}

export async function deleteShinaNoneKanjiWord(id: number): Promise<void> {
    await postShinaNoneKanjiWord<Record<string, never>>(`${API_BASE_URL}/delete_kanji_word`, {id});
}

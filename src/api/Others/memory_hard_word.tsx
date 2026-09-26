const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type MemoryHardWord = {
    id: number;
    word: string;
    ruby: string;
    meaning: string | null;
    created_at: string;
};

export type MemoryHardWordChanges = Omit<MemoryHardWord, "id" | "created_at">;

export async function getMemoryHardWord(): Promise<MemoryHardWord[]> {
    const response = await fetch(`${API_BASE_URL}/fetch_memory_hard_words`);
    if (!response.ok) throw new Error("Failed to load MemoryHardWord");
    return response.json();
}

async function postMemoryHardWord<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("memoryHardWord request failed");
    if (response.status === 204) return {} as T;
    return response.json();
}

export async function updateMemoryHardWord(id: number, changes: MemoryHardWordChanges): Promise<Partial<MemoryHardWord>> {
    return postMemoryHardWord<Partial<MemoryHardWord>>(`${API_BASE_URL}/update_memory_hard_words`, {id, ...changes});
}

export async function addMemoryHardWord(changes: MemoryHardWordChanges): Promise<Partial<MemoryHardWord>> {
    return postMemoryHardWord<Partial<MemoryHardWord>>(`${API_BASE_URL}/add_memory_hard_words`, changes);
}

export async function deleteMemoryHardWord(id: number): Promise<void> {
    await postMemoryHardWord<Record<string, never>>(`${API_BASE_URL}/delete_memory_hard_words`, {id});
}

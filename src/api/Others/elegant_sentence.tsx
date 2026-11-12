import { apiFetch, API_BASE } from "@/lib/auth";

export type ElegantSentence = {
    id: number;
    sentence: string;
    created_at: string;
};

export type ElegantSentenceChanges = Omit<ElegantSentence, "id" | "created_at">;

export async function getElegantSentence(): Promise<ElegantSentence[]> {
    const response = await apiFetch(`${API_BASE}/fetch_elegant_sentence`);
    if (!response.ok) throw new Error("Failed to load ElegantSentence");
    return response.json();
}

async function postElegantSentence<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await apiFetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Video request failed");
    if (response.status === 204) return {} as T;
    return response.json();
}

export async function updateElegantSentence(id: number, changes: ElegantSentenceChanges): Promise<Partial<ElegantSentence>> {
    return postElegantSentence<Partial<ElegantSentence>>(`${API_BASE}/update_elegant_sentence`, {id, ...changes});
}

export async function addElegantSentence(changes: ElegantSentenceChanges): Promise<Partial<ElegantSentence>> {
    return postElegantSentence<Partial<ElegantSentence>>(`${API_BASE}/add_elegant_sentence`, changes);
}

export async function deleteElegantSentence(id: number): Promise<void> {
    await postElegantSentence<Record<string, never>>(`${API_BASE}/delete_elegant_sentence`, {id});
}

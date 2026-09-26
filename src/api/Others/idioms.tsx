const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type Idioms = {
    id: number;
    word: string;
    ruby: string;
    meaning: string | null;
    created_at: string;
};

export type IdiomsChanges = Omit<Idioms, "id" | "created_at">;

export async function getIdioms(): Promise<Idioms[]> {
    const response = await fetch(`${API_BASE_URL}/fetch_idioms`);
    if (!response.ok) throw new Error("Failed to load Idioms");
    return response.json();
}

async function postIdioms<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("idioms request failed");
    if (response.status === 204) return {} as T;
    return response.json();
}

export async function updateIdioms(id: number, changes: IdiomsChanges): Promise<Partial<Idioms>> {
    return postIdioms<Partial<Idioms>>(`${API_BASE_URL}/update_idioms`, {id, ...changes});
}

export async function addIdioms(changes: IdiomsChanges): Promise<Partial<Idioms>> {
    return postIdioms<Partial<Idioms>>(`${API_BASE_URL}/add_idioms`, changes);
}

export async function deleteIdioms(id: number): Promise<void> {
    await postIdioms<Record<string, never>>(`${API_BASE_URL}/delete_idioms`, {id});
}

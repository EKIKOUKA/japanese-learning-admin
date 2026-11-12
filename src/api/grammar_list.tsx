import { apiFetch, API_BASE } from "@/lib/auth";

export type GrammarItem = {
    id: number;
    level: string;
    title: string;
    meaning: string;
    connection: string;
    examples: string;
    notes: string | null;
    is_important: number;
    is_marked: number;
}

export async function getGrammarList(level: string) {
    const response = await apiFetch(`${API_BASE}/fetch_grammars?level=${level}`);

    if (!response.ok) {
        throw new Error("Failed to load SkipWordsList");
    }

    return response.json();
}

export async function updateGrammar(item: GrammarItem): Promise<void> {
    const response = await apiFetch(`${API_BASE}/update_grammars`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(item)
    });

    if (!response.ok) {
        throw new Error("Failed to update grammar");
    }
}

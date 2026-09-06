const API_BASE_URL= import.meta.env.VITE_API_BASE_URL;

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

export async function getGrammarList() {
    const response = await fetch(`${API_BASE_URL}/fetch_grammars?level=N1`);

    if (!response.ok) {
        throw new Error("Failed to load SkipWordsList");
    }

    return response.json();
}

export async function updateGrammar(item: GrammarItem): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/update_grammars`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(item)
    });

    if (!response.ok) {
        throw new Error("Failed to update grammar");
    }
}

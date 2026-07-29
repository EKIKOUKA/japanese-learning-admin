const API_BASE_URL= import.meta.env.VITE_API_BASE_URL;

export async function getGrammarList() {
    const response = await fetch(`${API_BASE_URL}/fetch_grammars?level=N1`);

    if (!response.ok) {
        throw new Error("Failed to load SkipWordsList");
    }

    return response.json();
}
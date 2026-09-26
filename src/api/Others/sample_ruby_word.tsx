const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type SampleRubyWord = {
    id: number;
    word: string;
    ruby: string;
    meaning: string | null;
    created_at: string;
};

export type SampleRubyWordChanges = Omit<SampleRubyWord, "id" | "created_at">;

export async function getSampleRubyWord(): Promise<SampleRubyWord[]> {
    const response = await fetch(`${API_BASE_URL}/fetch_sample_ruby_words`);
    if (!response.ok) throw new Error("Failed to load SampleRubyWord");
    return response.json();
}

async function postSampleRubyWord<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("sampleRubyWord request failed");
    if (response.status === 204) return {} as T;
    return response.json();
}

export async function updateSampleRubyWord(id: number, changes: SampleRubyWordChanges): Promise<Partial<SampleRubyWord>> {
    return postSampleRubyWord<Partial<SampleRubyWord>>(`${API_BASE_URL}/update_sample_ruby_words`, {id, ...changes});
}

export async function addSampleRubyWord(changes: SampleRubyWordChanges): Promise<Partial<SampleRubyWord>> {
    return postSampleRubyWord<Partial<SampleRubyWord>>(`${API_BASE_URL}/add_sample_ruby_words`, changes);
}

export async function deleteSampleRubyWord(id: number): Promise<void> {
    await postSampleRubyWord<Record<string, never>>(`${API_BASE_URL}/delete_sample_ruby_words`, {id});
}

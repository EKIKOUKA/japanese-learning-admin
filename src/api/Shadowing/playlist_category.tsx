const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type PlaylistCategories = {
    id: number;
    title: string;
    category: string;
    playlist_id: string | null;
    sort_order: number;
    created_at: string;
};

export type PlaylistCategoriesChanges = Omit<PlaylistCategories, "id" | "created_at">;

export async function getOriginPlaylistCategories(): Promise<PlaylistCategories[]> {
    const response = await fetch(`${API_BASE_URL}/fetch_playlist_categories_origin`);
    if (!response.ok) throw new Error("Failed to load PlaylistCategories");
    return response.json();
}

async function postPlaylistCategories<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Video request failed");
    if (response.status === 204) return {} as T;
    return response.json();
}

export async function updatePlaylistCategories(id: number, changes: PlaylistCategoriesChanges): Promise<Partial<PlaylistCategories>> {
    return postPlaylistCategories<Partial<PlaylistCategories>>(`${API_BASE_URL}/update_playlist_category`, {id, ...changes});
}

export async function addPlaylistCategories(changes: PlaylistCategoriesChanges): Promise<Partial<PlaylistCategories>> {
    return postPlaylistCategories<Partial<PlaylistCategories>>(`${API_BASE_URL}/add_playlist_category`, changes);
}

export async function deletePlaylistCategories(id: number): Promise<void> {
    await postPlaylistCategories<Record<string, never>>(`${API_BASE_URL}/delete_playlist_category`, {id});
}

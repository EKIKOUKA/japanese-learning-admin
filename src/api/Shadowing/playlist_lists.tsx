const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type PlaylistLists = {
    id: string;
    title: string;
    author: string;
    thumbnailURL: string | null;
    created_at: string;
};

export type PlaylistListsCreate = Omit<PlaylistLists, "created_at">;
export type PlaylistListsUpdate = Omit<PlaylistLists, "id" | "created_at">;

export async function getPlaylistLists(): Promise<PlaylistLists[]> {
    const response = await fetch(`${API_BASE_URL}/fetch_video_playlist`);
    if (!response.ok) throw new Error("Failed to load PlaylistLists");
    return response.json();
}

async function postPlaylistLists<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Video request failed");
    if (response.status === 204) return {} as T;
    return response.json();
}

export async function updatePlaylistLists(id: string, changes: PlaylistListsUpdate): Promise<Partial<PlaylistLists>> {
    return postPlaylistLists<Partial<PlaylistLists>>(`${API_BASE_URL}/update_video_playlist`, {id, ...changes});
}

export async function addPlaylistLists(changes: PlaylistListsCreate): Promise<Partial<PlaylistLists>> {
    return postPlaylistLists<Partial<PlaylistLists>>(`${API_BASE_URL}/add_video_playlist`, changes);
}

export async function deletePlaylistLists(id: string): Promise<void> {
    await postPlaylistLists<Record<string, never>>(`${API_BASE_URL}/delete_video_playlist`, {id});
}

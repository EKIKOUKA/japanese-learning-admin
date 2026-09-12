const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type Video = {
    id: string;
    title: string | null;
    created_at: string;
    current_time: number;
    rate: number;
    category_id: string;
    playlist_id: string | null;
    status: string;
    content_language: string;
    aspect_ratio: number;
};

export type VideoChanges = Omit<Video, "id" | "created_at">;

export type PlaylistCategory = {
    id: string;
    title: string;
};

export async function getVideos(): Promise<Video[]> {
    const response = await fetch(`${API_BASE_URL}/fetch_videos`);
    if (!response.ok) throw new Error("Failed to load videos");
    return response.json();
}

export async function getPlaylistCategories(): Promise<PlaylistCategory[]> {
    const response = await fetch(`${API_BASE_URL}/fetch_playlist_categories`);
    if (!response.ok) throw new Error("Failed to load playlist categories");
    return response.json();
}

async function postVideo<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Video request failed");
    if (response.status === 204) return {} as T;
    return response.json();
}

export async function updateVideo(id: string, changes: VideoChanges): Promise<Partial<Video>> {
    return postVideo<Partial<Video>>(`${API_BASE_URL}/update_video`, {id, ...changes});
}

export async function deleteVideo(id: string): Promise<void> {
    await postVideo<Record<string, never>>(`${API_BASE_URL}/delete_video`, {id});
}

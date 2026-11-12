import { apiFetch, API_BASE } from "@/lib/auth";

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
    duration_seconds: number | null;
};

export type VideoChanges = Omit<Video, "id" | "created_at" | "duration_seconds">;

export type PlaylistCategory = {
    id: string;
    title: string;
};

export async function getVideos(signal?: AbortSignal): Promise<Video[]> {
    const response = await apiFetch(`${API_BASE}/fetch_videos`, { signal });
    if (!response.ok) throw new Error("Failed to load videos");
    return response.json();
}

export async function getPlaylistCategories(): Promise<PlaylistCategory[]> {
    const response = await apiFetch(`${API_BASE}/fetch_playlist_categories`);
    if (!response.ok) throw new Error("Failed to load playlist categories");
    return response.json();
}

async function postVideo<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await apiFetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Video request failed");
    if (response.status === 204) return {} as T;
    return response.json();
}

export async function updateVideo(id: string, changes: VideoChanges): Promise<Partial<Video>> {
    return postVideo<Partial<Video>>(`${API_BASE}/update_video`, {id, ...changes});
}

export async function deleteVideo(id: string): Promise<void> {
    await postVideo<Record<string, never>>(`${API_BASE}/delete_video`, {id});
}

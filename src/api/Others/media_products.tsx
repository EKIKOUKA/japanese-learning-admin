const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export type MediaProduct = {
    id: string;
    title: string;
    created_at: string;
    category: string;
    details_url: string | null;
    memo: string | null;
};

export type MediaProductChanges = Omit<MediaProduct, "id" | "created_at">;

export async function getMediaProducts(): Promise<MediaProduct[]> {
    const response = await fetch(`${API_BASE_URL}/fetch_video_products`);
    if (!response.ok) throw new Error("Failed to load MediaProduct");
    return response.json();
}

async function postMediaProduct<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error("Video request failed");
    if (response.status === 204) return {} as T;
    return response.json();
}

export async function updateMediaProduct(id: string, changes: MediaProductChanges): Promise<Partial<MediaProduct>> {
    return postMediaProduct<Partial<MediaProduct>>(`${API_BASE_URL}/update_video_products`, {id, ...changes});
}

export async function addMediaProduct(changes: MediaProductChanges): Promise<Partial<MediaProduct>> {
    return postMediaProduct<Partial<MediaProduct>>(`${API_BASE_URL}/add_video_products`, changes);
}

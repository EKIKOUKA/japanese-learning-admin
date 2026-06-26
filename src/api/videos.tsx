export async function getVideos() {
    const API_BASE_URL= import.meta.env.VITE_API_BASE_URL;

    const response = await fetch(
        `${API_BASE_URL}/fetch_videos`
    );

    if (!response.ok) {
        throw new Error("Failed to load videos");
    }

    return response.json();
}
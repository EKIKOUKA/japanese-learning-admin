export async function getVideos() {
    const VITE_API_BASE_URL= import.meta.env.VITE_API_BASE_URL;

    const response = await fetch(
        `${VITE_API_BASE_URL}/shadowing/fetch_videos`
    );

    if (!response.ok) {
        throw new Error("Failed to load videos");
    }

    return response.json();
}
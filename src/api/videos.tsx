export async function getVideos() {
    const response = await fetch(
        "https://japanese-learning.makoto.lol/shadowing/fetch_videos"
    );

    if (!response.ok) {
        throw new Error("Failed to load videos");
    }

    return response.json();
}
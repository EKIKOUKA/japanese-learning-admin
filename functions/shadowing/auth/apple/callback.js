// Apple requires this HTTPS return URL to be on the registered Admin domain.
export async function onRequestPost({ request }) {
    return fetch("https://japanese-learning.makoto.lol/shadowing/auth/apple/callback", {
        method: "POST",
        headers: { "Content-Type": request.headers.get("Content-Type") ?? "" },
        body: request.body,
        redirect: "manual",
    });
}

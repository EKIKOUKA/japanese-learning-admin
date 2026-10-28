export const API_BASE = (import.meta.env.VITE_API_BASE_URL || "https://japanese-learning.makoto.lol/shadowing").replace(/\/$/, "");
const key = "japanese-session";
export const getToken = () => sessionStorage.getItem(key);
export const setToken = (token: string) => sessionStorage.setItem(key, token);
export const clearToken = () => sessionStorage.removeItem(key);

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
    const headers = new Headers(init?.headers);
    const token = getToken();
    const url = new URL(input instanceof Request ? input.url : String(input), location.origin);
    const base = new URL(API_BASE, location.origin);
    if (token && url.origin === base.origin && url.pathname.startsWith(base.pathname + "/")) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(input, { ...init, headers });
    if (response.status === 401) {
        clearToken();
        if (location.pathname !== "/login") location.replace("/login");
    }

    return response;
}

export async function logout() {
    try { await apiFetch(`${API_BASE}/user/logout`, { method: "POST" }); }
    finally { clearToken(); location.replace("/login"); }
}

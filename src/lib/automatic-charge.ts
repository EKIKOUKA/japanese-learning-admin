import { API_BASE, apiFetch } from "@/lib/auth";

export async function chargeRequest(path: string, body = {}) {
    const response = await apiFetch(`${API_BASE}/payments/stripe/auto/${path}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "設定を取得できませんでした。");
    return data;
}

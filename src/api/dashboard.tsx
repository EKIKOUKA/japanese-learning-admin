import { apiFetch, API_BASE } from "@/lib/auth";
import { sessionDate } from "@/api/Shadowing/practice_record";

export async function getBalance(signal: AbortSignal) {
    const response = await apiFetch(`${API_BASE}/users`, { signal });
    if (!response.ok) throw new Error("残高を取得できませんでした。");
    const data = await response.json();
    if (typeof data.creditBalance !== "number") throw new Error("残高を取得できませんでした。");

    return data.creditBalance as number;
}

export async function getWeeklyCreditsUsed(signal: AbortSignal) {
    const response = await apiFetch(`${API_BASE}/credits/usage_history`, { signal });
    if (!response.ok) throw new Error("今週の利用クレジットを取得できませんでした。");
    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
        throw new Error("今週の利用クレジットを取得できませんでした。");
    }

    const records = (data as unknown[]).map(record => {
        if (typeof record !== "object" || record === null || !("credits_used" in record) ||
            typeof record.credits_used !== "number" || !("created_at" in record) || typeof record.created_at !== "string") {
            throw new Error("今週の利用クレジットを取得できませんでした。");
        }
        return { credits: record.credits_used, date: sessionDate(record.created_at).getTime() };
    });

    const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
    const today = Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate());
    const monday = today - ((jstNow.getUTCDay() + 6) % 7) * 24 * 60 * 60 * 1000;
    const weekStart = monday - 9 * 60 * 60 * 1000;
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;

    return records.reduce((total, record) => record.date >= weekStart && record.date < weekEnd ? total + record.credits : total, 0);
}

import { API_BASE, apiFetch } from "@/lib/auth";

export type Session = {
    id: string;
    started_at: string;
    duration_seconds: number;
    content_language: string | null;
};

type SyncPage = {
    changes: { id: string; deleted: boolean; session: Session | null }[];
    nextCursor: number;
    until: number;
    hasMore: boolean;
    reset: boolean;
};

export function sessionDate(value: string) {
    // SQLite のタイムゾーンなし日時は UTC として扱う。
    const normalized = value.replace(" ", "T");
    return new Date(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : normalized + "Z");
}

export async function fetchSessions(signal: AbortSignal) {
    const sessions = new Map<string, Session>();
    let cursor = 0;
    let until: number | undefined;

    while (true) {
        const query = new URLSearchParams({ cursor: String(cursor), limit: "500" });
        if (until !== undefined) query.set("until", String(until));
        const response = await apiFetch(`${API_BASE}/sync_practice_sessions?${query}`, { signal });
        if (!response.ok) {
            const body = await response.json().catch(() => null);
            throw new Error(body?.error || "練習記録を取得できませんでした。");
        }
        const page: SyncPage = await response.json();
        if (page.reset) sessions.clear();
        for (const change of page.changes) {
            if (change.deleted) sessions.delete(change.id);
            else if (change.session) sessions.set(change.id, change.session);
        }
        if (!page.hasMore) break;
        if (!page.reset && page.nextCursor <= cursor) throw new Error("練習記録の同期に失敗しました。");
        cursor = page.nextCursor;
        until = page.until;
    }

    return [...sessions.values()].sort((a, b) => sessionDate(b.started_at).getTime() - sessionDate(a.started_at).getTime());
}

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { fetchSessions, sessionDate, type Session } from "@/api/Shadowing/practice_record";

const dateTime = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo", dateStyle: "medium", timeStyle: "short",
});

function duration(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds / 60) % 60;
    return [hours ? `${hours}時間` : "", minutes ? `${minutes}分` : "", `${seconds % 60}秒`].join("");
}

const periods = [
    ["day", "日"], ["week", "週"], ["month", "月"], ["halfYear", "6か月"], ["year", "年"],
] as const;
type Period = typeof periods[number][0];
const jstOffset = 9 * 60 * 60 * 1000;
const dayLength = 24 * 60 * 60 * 1000;
const hourLength = dayLength / 24;
const rangeDate = new Intl.DateTimeFormat("ja-JP", { timeZone: "UTC", dateStyle: "medium" });

function practiceBuckets(sessions: Session[], period: Period, offset: number) {
    // 日本時間のカレンダーを UTC 座標にずらして、閲覧端末の時差に依存させない。
    const today = new Date(Date.now() + jstOffset);
    const year = today.getUTCFullYear(), month = today.getUTCMonth(), day = today.getUTCDate();
    const midnight = Date.UTC(year, month, day);
    const monthStart = (delta: number) => Date.UTC(year, month + delta, 1);
    let edges: number[];

    switch (period) {
        case "day":
            edges = Array.from({ length: 25 }, (_, hour) => midnight + offset * dayLength + hour * hourLength);
            break;
        case "week": {
            const monday = midnight - ((today.getUTCDay() + 6) % 7) * dayLength;
            edges = Array.from({ length: 8 }, (_, dayIndex) => monday + (offset * 7 + dayIndex) * dayLength);
            break;
        }
        case "month": {
            const start = monthStart(offset), end = monthStart(offset + 1);
            edges = Array.from({ length: (end - start) / dayLength + 1 }, (_, dayIndex) => start + dayIndex * dayLength);
            break;
        }
        case "halfYear":
            edges = Array.from({ length: 7 }, (_, index) => monthStart(offset * 6 - 5 + index));
            break;
        case "year":
            edges = Array.from({ length: 13 }, (_, index) => Date.UTC(year + offset, index, 1));
            break;
    }

    const buckets = edges.slice(0, -1).map((start, index) => {
        const date = new Date(start);
        const label = period === "day" ? `${date.getUTCHours()}時`
            : period === "halfYear" || period === "year" ? `${date.getUTCMonth() + 1}月`
            : `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;

        return { start, end: edges[index + 1], label, seconds: 0 };
    });

    for (const session of sessions) {
        const start = sessionDate(session.started_at).getTime() + jstOffset;
        const bucket = buckets.find(item => start >= item.start && start < item.end);
        if (bucket) bucket.seconds += session.duration_seconds;
    }

    return buckets;
}

export function PracticeChart({ sessions, weeklyOnly = false }: { sessions: Session[]; weeklyOnly?: boolean }) {
    const [period, setPeriod] = useState<Period>("week");
    const [offset, setOffset] = useState(0);
    const buckets = practiceBuckets(sessions, period, offset);
    const total = buckets.reduce((sum, bucket) => sum + bucket.seconds, 0);
    const range = `${rangeDate.format(buckets[0].start)} ～ ${rangeDate.format(buckets.at(-1)!.end - 1)}`;
    const labelEvery = period === "day" ? 4 : period === "month" ? 5 : 1;

    return <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
        <h2 className="text-lg font-semibold">{weeklyOnly ? "今週の練習" : "練習時間"}</h2>
        {!weeklyOnly && <div className="flex flex-wrap gap-2" aria-label="表示期間">
            {periods.map(([value, label]) => <button key={value} type="button" aria-pressed={period === value}
                className={`rounded-lg border px-3 py-1.5 text-sm ${period === value ? "bg-primary text-primary-foreground" : ""}`}
                onClick={() => { setPeriod(value); setOffset(0); }}>{label}</button>)}
        </div>}
        <div className="flex flex-wrap items-center gap-3 text-sm">
            {!weeklyOnly && <button type="button" className="rounded border px-2 py-1" onClick={() => { setOffset(offset - 1); }}>前へ</button>}
            <span>{range}</span>
            {!weeklyOnly && <button type="button" disabled={offset === 0} className="rounded border px-2 py-1 disabled:opacity-50"
                onClick={() => { setOffset(offset + 1); }}>次へ</button>}
        </div>
        <p className="text-2xl font-semibold tabular-nums">{duration(total)}</p>
        <div className="h-64 min-w-0 sm:h-72" aria-label="練習時間の棒グラフ">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4"/>
                    <XAxis dataKey="label" interval={labelEvery - 1} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        tickLine={false} axisLine={{ stroke: "var(--border)" }}/>
                    <YAxis width={52} allowDecimals={false} domain={[0, (max: number) => Math.max(60, max)]}
                        tickFormatter={(seconds: number) => seconds === 0 ? "0" : seconds < 60 ? `${seconds}秒` : `${Number((seconds / 60).toFixed(1))}分`}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={{ stroke: "var(--border)" }}/>
                    <Tooltip
                        cursor={{ fill: "var(--muted)", fillOpacity: 0.7 }}
                        formatter={value => [duration(Number(value)), "練習時間"]}
                        contentStyle={{ background: "var(--popover)", borderColor: "var(--border)", borderRadius: 8 }}
                        labelStyle={{ color: "var(--popover-foreground)" }}
                        itemStyle={{ color: "var(--popover-foreground)" }}
                    />
                    <Bar dataKey="seconds" name="練習時間" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={44}/>
                </BarChart>
            </ResponsiveContainer>
        </div>
        {!total && <p className="text-sm text-muted-foreground">この期間の練習記録はありません。</p>}
    </section>;
}

export function PracticeRecord() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [revision, setRevision] = useState(0);
    const [visibleCount, setVisibleCount] = useState(50);

    useEffect(() => {
        const controller = new AbortController();
        fetchSessions(controller.signal).then(result => {
            if (!controller.signal.aborted) setSessions(result);
        }).catch(cause => {
            if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "練習記録を取得できませんでした。");
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        });

        return () => controller.abort();
    }, [revision]);

    return <div className="w-full p-5 text-left sm:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-semibold tracking-tight">練習記録</h1>
                <button type="button" disabled={loading} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
                    onClick={() => {
                        setLoading(true);
                        setError("");
                        setRevision(value => value + 1);
                    }}>更新</button>
            </header>
            {loading && <p role="status" className="text-muted-foreground">練習記録を読み込み中…</p>}
            {error && <p role="alert" className="text-destructive">{error}</p>}
            {!loading && !error && sessions.length === 0 && <p className="text-muted-foreground">練習記録はまだありません。</p>}
            {!loading && !error && <PracticeChart sessions={sessions}/>}
            {sessions.length > 0 && <section className="space-y-3" aria-label="練習明細">
                <h2 className="text-lg font-semibold">練習明細</h2>
                <p className="text-sm text-muted-foreground">{sessions.length.toLocaleString("ja-JP")} 件 ・ 合計 {duration(sessions.reduce((sum, item) => sum + item.duration_seconds, 0))}</p>
                <div className="overflow-x-auto rounded-xl border bg-card">
                    <table className="w-full text-sm">
                        <thead className="border-b text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium" scope="col">練習日時</th>
                                <th className="px-4 py-3 font-medium" scope="col">言語</th>
                                <th className="px-4 py-3 text-right font-medium" scope="col">練習時間</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {sessions.slice(0, visibleCount).map(session => {
                                const date = sessionDate(session.started_at);

                                return <tr key={session.id}>
                                    <td className="px-4 py-3">{Number.isNaN(date.getTime()) ? "—" : dateTime.format(date)}</td>
                                    <td className="px-4 py-3">{session.content_language === "ja" ? "日本語" : session.content_language === "en" ? "英語" : session.content_language || "—"}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{duration(session.duration_seconds)}</td>
                                </tr>;
                            })}
                        </tbody>
                    </table>
                </div>
                {sessions.length > visibleCount && <button type="button" className="rounded-lg border px-4 py-2 text-sm"
                    onClick={() => setVisibleCount(count => count + 50)}>もっと見る</button>}
            </section>}
        </div>
    </div>;
}

import { useEffect, useState } from "react";
import { ArrowUpRight, CloudUpload, Timer, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { getBalance, getWeeklyCreditsUsed } from "@/api/dashboard";
import { fetchSessions, sessionDate } from "@/api/Shadowing/practice_record";
import { getVideos, type Video } from "@/api/Shadowing/videos";
import { PracticeChart } from "@/pages/Shadowing/PracticeRecord";

function videoDuration(seconds: number | null) {
    if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return "長さ不明";
    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor(total / 60) % 60;
    const remainder = total % 60;

    return hours > 0
        ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
        : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function totalVideoDuration(seconds: number) {
    const totalMinutes = Math.floor(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes}分`;

    return minutes === 0 ? `${hours}時間` : `${hours}時間${minutes}分`;
}

function useDashboardData<T>(load: (signal: AbortSignal) => Promise<T>) {
    const [value, setValue] = useState<T | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal).then(result => {
            if (!controller.signal.aborted) setValue(result);
        }).catch(() => {
            if (!controller.signal.aborted) setFailed(true);
        });

        return () => controller.abort();
    }, [load]);

    return { value, failed };
}

export function Dashboard() {
    const balance = useDashboardData(getBalance);
    const weeklyCreditsUsed = useDashboardData(getWeeklyCreditsUsed);
    const sessions = useDashboardData(fetchSessions);
    const videos = useDashboardData(getVideos);
    const recent = videos.value?.toSorted((a, b) => sessionDate(b.created_at).getTime() - sessionDate(a.created_at).getTime()).slice(0, 5);
    const totalDuration = videos.value
        ? totalVideoDuration(videos.value.reduce((total, video) => total + (video.duration_seconds && video.duration_seconds > 0 ? video.duration_seconds : 0), 0))
        : null;

    return <main className="w-full p-5 text-left sm:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-semibold tracking-tight">ホーム</h1>
                <Link to="/shadowing/upload" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                    <CloudUpload size={16} aria-hidden="true"/>動画をアップロード
                </Link>
            </header>

            <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <div className="min-w-0 space-y-2">
                    {sessions.value ? <PracticeChart sessions={sessions.value} weeklyOnly/> :
                        <section className="space-y-3 rounded-xl border bg-card p-5">
                            <h2 className="font-semibold">今週の練習</h2>
                            <p role={sessions.failed ? "alert" : "status"} className="text-sm text-muted-foreground">
                                {sessions.failed ? "練習記録を取得できませんでした。" : "読み込み中…"}
                            </p>
                        </section>}
                    <Link to="/shadowing/practice_record" className="inline-flex items-center gap-1 text-sm hover:underline">
                        練習記録を見る<ArrowUpRight size={14} aria-hidden="true"/>
                    </Link>
                </div>

                <div className="space-y-5">
                    <section className="space-y-4 rounded-xl border bg-card p-5">
                        <h2 className="flex items-center gap-2 font-semibold"><Wallet size={18} aria-hidden="true"/>クレジット残高</h2>
                        {balance.value !== null ? <p className="flex flex-wrap items-baseline gap-2">
                            <span className="text-3xl font-semibold tabular-nums">{balance.value.toLocaleString("ja-JP")}</span>
                            <span className="text-sm text-muted-foreground">クレジット</span>
                        </p> : <p role={balance.failed ? "alert" : "status"} className="text-sm text-muted-foreground">
                            {balance.failed ? "残高を取得できませんでした。" : "読み込み中…"}
                        </p>}
                        <p className="text-sm text-muted-foreground">
                            今週の利用: {weeklyCreditsUsed.value !== null ? <span className="font-medium tabular-nums text-foreground">{weeklyCreditsUsed.value.toLocaleString("ja-JP")} クレジット</span> :
                                <span role={weeklyCreditsUsed.failed ? "alert" : "status"}>{weeklyCreditsUsed.failed ? "取得できませんでした。" : "読み込み中…"}</span>}
                        </p>
                        <Link to="/credits" className="inline-flex items-center gap-1 text-sm hover:underline">
                            チャージする<ArrowUpRight size={14} aria-hidden="true"/>
                        </Link>
                    </section>

                    <section className="space-y-4 rounded-xl border bg-card p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="font-semibold">動画ライブラリ</h2>
                        </div>
                        {videos.value ? <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">登録動画</p>
                                <p className="text-2xl font-semibold tabular-nums">
                                    {videos.value.length.toLocaleString("ja-JP")}
                                    <span className="ml-1 text-sm font-normal">本</span>
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">合計時間</p>
                                <p className="text-2xl font-semibold tabular-nums">{totalDuration}</p>
                            </div>
                        </div> : <p role={videos.failed ? "alert" : "status"} className="text-sm text-muted-foreground">
                            {videos.failed ? "動画情報を取得できませんでした。" : "読み込み中…"}
                        </p>}
                    </section>
                </div>
            </div>

            <section className="space-y-3 rounded-xl border bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold">最近の動画</h2>
                    <Link to="/shadowing/videos" className="inline-flex items-center gap-1 text-sm hover:underline">
                        動画リストへ<ArrowUpRight size={14} aria-hidden="true"/>
                    </Link>
                </div>
                {recent?.length ? <ul className="divide-y">
                    {recent.map((video: Video) => <li key={video.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <span className="min-w-0 truncate" title={video.title ?? undefined}>{video.title || "タイトルなし"}</span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground" title="動画の長さ">
                            <Timer size={14} aria-hidden="true"/>{videoDuration(video.duration_seconds)}
                        </span>
                    </li>)}
                </ul> : <p role={videos.failed ? "alert" : "status"} className="text-sm text-muted-foreground">
                    {videos.failed ? "動画を取得できませんでした。" : recent ? "動画はまだありません。" : "読み込み中…"}
                </p>}
            </section>
        </div>
    </main>;
}

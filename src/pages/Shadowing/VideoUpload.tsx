import { useState, type FormEvent } from "react";
import { API_BASE, apiFetch } from "@/lib/auth";

export function VideoUpload() {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    async function upload(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        const form = event.currentTarget;
        const body = new FormData(form);
        const video = body.get("video"), srt = body.get("srt");
        if (!(video instanceof File) || !/\.(mp4|mov)$/i.test(video.name) || !(srt instanceof File) || !/\.srt$/i.test(srt.name)) {
            setError("MP4・MOV の動画と SRT の字幕を選択してください。"); return;
        }
        setBusy(true); setError(""); setNotice("");

        try {
            const response = await apiFetch(`${API_BASE}/upload__video_caption`, { method: "POST", body });
            if (!response.headers.get("content-type")?.includes("application/json")) throw new Error(`アップロードに失敗しました（HTTP ${response.status}）。動画一覧で処理状況を確認してから再試行してください。`);
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || result.detail || "動画を処理できませんでした。");
            setNotice(`動画と字幕の処理が完了しました。${result.id ? ` 動画 ID: ${result.id}` : ""}`); form.reset();
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "通信に失敗しました。動画一覧を確認してください。");
        }

        finally { setBusy(false); }
    }

    return <div className="w-full p-5 text-left sm:p-8"><div className="mx-auto max-w-3xl space-y-6">
        <header><h1 className="text-3xl font-semibold tracking-tight">動画と字幕のアップロード</h1><p className="mt-2 text-muted-foreground">動画ファイルと SRT 字幕を選択して、シャドーイング用に処理します。</p></header>
        <form onSubmit={event => void upload(event)} className="space-y-6 rounded-xl border bg-card p-5 shadow-sm sm:p-7" aria-busy={busy}>
            <div className="space-y-2"><label htmlFor="video-upload" className="block font-medium">動画ファイル</label><input id="video-upload" name="video" type="file" accept=".mp4,.mov" required disabled={busy} className="block w-full rounded-lg border p-3 text-sm"/><p className="text-sm text-muted-foreground">MP4 または MOV</p></div>
            <div className="space-y-2"><label htmlFor="subtitle-upload" className="block font-medium">字幕ファイル</label><input id="subtitle-upload" name="srt" type="file" accept=".srt" required disabled={busy} className="block w-full rounded-lg border p-3 text-sm"/><p className="text-sm text-muted-foreground">動画に対応する SRT 字幕</p></div>
            <p className="text-sm text-muted-foreground">完了するまで、このページを開いたままお待ちください。</p>
            <button disabled={busy} className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{busy ? "アップロード・処理中…" : "アップロードして処理する"}</button>
            {busy && <p role="status" className="text-sm text-muted-foreground">動画の長さによっては時間がかかります。</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
        </form>
    </div></div>;
}

import {useState, type FormEvent} from "react";
import {API_BASE, apiFetch} from "@/lib/auth";

const partBytes = 8 * 1024 * 1024;

async function stageVideo(video: File, updateProgress: (percent: number) => void) {
    async function send(query: URLSearchParams, body?: BodyInit) {
        const response = await apiFetch(`${API_BASE}/upload__video_parts?${query}`, { method: "POST", body });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result) throw new Error(result?.error || `動画をアップロードできませんでした（HTTP ${response.status}）。`);

        return result;
    }

    const extension = video.name.split(".").at(-1)!.toLowerCase();
    const { key } = await send(new URLSearchParams({ action: "start", extension }));
    const params = { key };

    try {
        for (let offset = 0; offset < video.size; offset += partBytes) {
            const chunk = video.slice(offset, offset + partBytes);
            await send(new URLSearchParams({ ...params, action: "part", offset: String(offset) }), chunk);
            updateProgress(Math.round(Math.min(offset + chunk.size, video.size) / video.size * 100));
        }

        return key as string;
    } catch (error) {
        await send(new URLSearchParams({ ...params, action: "abort" })).catch(() => {});
        throw error;
    }
}

export function VideoUpload() {
    const [hasSubtitle, setHasSubtitle] = useState(false);
    const [progress, setProgress] = useState(0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    async function upload(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        const form = event.currentTarget;
        const body = new FormData(form);
        const video = body.get("video"), subtitle = body.get("srt");
        const title = video instanceof File ? video.name.replace(/\.(mp4|mov)$/i, "").trim() : "";
        const subtitleName = subtitle instanceof File ? subtitle.name : "";
        const youtubeID = subtitleName
            ? subtitleName.match(/^([A-Za-z0-9_-]{11})(?:\.[A-Za-z0-9-]+)?\.(?:srt|json3)$/i)?.[1] ?? ""
            : String(body.get("youtube_id") ?? "").trim();
        if (!/^[A-Za-z0-9_-]{11}$/.test(youtubeID)) {
            setError(subtitleName ? "字幕ファイル名を「動画ID.ja.json3」または「動画ID.srt」にしてください。" : "11 文字の YouTube 動画 ID を入力してください。");
            return;
        }
        if (!(video instanceof File) || !video.size || !/\.(mp4|mov)$/i.test(video.name) || (subtitle instanceof File && subtitle.name !== "" && !/\.(srt|json3)$/i.test(subtitle.name))) {
            setError("MP4・MOV の動画と、必要に応じて SRT・JSON3 の字幕を選択してください。");
            return;
        }
        if (!(subtitle instanceof File) || !subtitle.name) body.delete("srt");
        body.delete("youtube_id");
        const params = new URLSearchParams({youtube_id: youtubeID, title: title.slice(0, 300)});
        body.delete("video");
        if (video.size > 2 * 1024 ** 3) {
            setError("動画ファイルは 2 GiB 以下にしてください。");
            return;
        }
        setProgress(0);
        setBusy(true);
        setError("");
        setNotice("");

        try {
            params.set("staged_key", await stageVideo(video, setProgress));
            params.set("staged_size", String(video.size));
            const response = await apiFetch(`${API_BASE}/upload__video_caption?${params}`, {method: "POST", body});
            if (!response.headers.get("content-type")?.includes("application/json")) {
                throw new Error(`アップロードに失敗しました（HTTP ${response.status}）。動画一覧で処理状況を確認してから再試行してください。`);
            }
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || result.detail || "動画を処理できませんでした。");
            setNotice(`動画と字幕の処理が完了しました。${result.id ? ` 動画 ID: ${result.id}` : ""}`);
            form.reset();
            setHasSubtitle(false);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "通信に失敗しました。動画一覧を確認してください。");
        } finally {
            setBusy(false);
        }
    }

    return <div className="w-full p-5 text-left sm:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
            <header>
                <h1 className="text-3xl font-semibold tracking-tight">
                    動画と字幕のアップロード
                </h1>
                <p className="mt-2 text-muted-foreground">
                    手元の動画ファイルをシャドーイング用に処理します。
                </p>
            </header>
            <form onSubmit={event => void upload(event)}
                  className="space-y-6 rounded-xl border bg-card p-5 shadow-sm sm:p-7" aria-busy={busy}>
                <div className="space-y-2">
                    <label htmlFor="video-upload" className="block font-medium">
                        動画ファイル
                    </label>
                    <input id="video-upload" name="video" type="file" accept=".mp4,.mov" required disabled={busy}
                        className="block w-full rounded-lg border p-3 text-sm"/>
                    <p className="text-sm text-muted-foreground">
                        MP4 または MOV
                    </p>
                </div>
                <div className="space-y-2">
                    <label htmlFor="subtitle-upload" className="block font-medium">
                        字幕ファイル（任意）
                    </label>
                    <input id="subtitle-upload" name="srt" type="file" accept=".srt,.json3"
                        onChange={event => setHasSubtitle(Boolean(event.currentTarget.files?.length))} disabled={busy}
                        className="block w-full rounded-lg border p-3 text-sm"
                    />
                    <p className="text-sm text-muted-foreground">
                        SRT または YouTube の JSON3。省略すると日本語の自動字幕を取得します。
                    </p>
                </div>
                {!hasSubtitle && <div className="space-y-2">
                    <label htmlFor="upload-youtube-id" className="block font-medium">
                        YouTube 動画 ID
                    </label>
                    <input id="upload-youtube-id" name="youtube_id" required maxLength={11} disabled={busy}
                           className="block w-full rounded-lg border p-3 text-sm"
                    />
                    </div>
                }
                <p className="text-sm text-muted-foreground">
                    完了するまで、このページを開いたままお待ちください。
                </p>
                <button disabled={busy} className="rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">
                    {busy ? "アップロード・処理中…" : "アップロードして処理する"}
                </button>
                {busy && <p role="status" className="text-sm text-muted-foreground">{progress < 100 ? `アップロード中… ${progress}%` : "アップロード済み。動画と字幕を処理しています…"}</p>}
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                {notice && <p role="status" className="text-sm text-emerald-700">{notice}</p>}
            </form>
        </div>
    </div>;
}

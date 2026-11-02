import {useEffect, useRef, useState} from "react";
import {API_BASE, apiFetch} from "@/lib/auth";

import {ChargeEditor, type ChargeRule as Rule, type ChargeConfig} from "./AutomaticChargeAuthorization";
import {chargeRequest as request} from "@/lib/automatic-charge";

const yen = (amount: number) => `¥${amount.toLocaleString("ja-JP")}`;
const labels: Record<string, string> = {
    active: "有効",
    disabled: "停止中",
    pending_authorization: "承認待ち",
    requires_authorization: "再承認が必要"
};

export function AutomaticCharge() {
    const [settings, setSettings] = useState<Rule[]>([]);
    const [config, setConfig] = useState<ChargeConfig | null>(null);
    const [editing, setEditing] = useState<Rule["type"] | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [authorizing, setAuthorizing] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [confirm, setConfirm] = useState<Rule | null>(null);
    const [notice, setNotice] = useState("");
    const dialog = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (confirm && !dialog.current?.open) dialog.current?.showModal();
        if (!confirm) dialog.current?.close();
    }, [confirm]);

    useEffect(() => {
        let active = true;
        Promise.all([request("settings"), apiFetch(`${API_BASE}/payments/stripe/config`, {method: "POST"}).then(async response => {
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "決済設定を取得できませんでした。");

            return data as ChargeConfig;
        })]).then(([data, configuration]) => {
            if (active) {
                setSettings(data.settings);
                setBalance(data.creditBalance);
                setConfig(configuration);
            }
        }).catch(cause => {
            if (active) setError(cause instanceof Error ? cause.message : "読み込みに失敗しました。");
        })
        .finally(() => {
            if (active) setLoading(false);
        });

        return () => {
            active = false;
        };
    }, []);

    async function stop() {
        if (!confirm || stopping) return;
        setStopping(true);
        setError("");

        try {
            const data = await request("disable", {type: confirm.type});
            setSettings(data.settings);
            setEditing(null);
            setConfirm(null);
            setNotice("自動チャージを停止しました。");
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "停止できませんでした。");
        } finally {
            setStopping(false);
        }
    }

    return <div className="w-full p-5 text-left sm:p-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <header><h1 className="text-3xl font-semibold tracking-tight">自動チャージの管理</h1>
                <p className="mt-2 text-muted-foreground">毎月のチャージと残高不足時の追加チャージを、それぞれ設定できます。Apple
                    Pay で承認して保存します。</p></header>
            {config?.publishableKey.startsWith("pk_test_") &&
                <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">テストモードです。実際の請求は発生しません。</p>}
            {balance !== null && <div className="rounded-xl border bg-card p-5"><p
                className="text-sm text-muted-foreground">クレジット残高</p><p
                className="mt-1 text-2xl font-semibold">{balance.toLocaleString("ja-JP")} <span
                className="text-base font-normal">クレジット</span></p></div>}
            {error && <div role="alert" className="rounded-xl border p-5 text-destructive">{error}
                <button className="ml-4 underline" onClick={() => location.reload()}
                        disabled={stopping || authorizing}>再読み込み
                </button>
            </div>}
            {notice && <p role="status" className="text-emerald-700">{notice}</p>}
            {loading ? <div role="status"
                            className="rounded-xl border p-10 text-center text-muted-foreground">設定を読み込んでいます…</div> : !error || settings.length > 0 ?
                (["monthly", "low_balance"] as const).map(type => {
                    const rule = settings.find(item => item.type === type);
                    return <section key={type} className="flex flex-col items-start gap-4 rounded-xl border bg-card p-5 shadow-sm sm:p-7">
                        <div className="flex w-full flex-wrap items-center justify-between gap-3"><h2
                            className="text-lg font-semibold">{type === "monthly" ? "毎月のチャージ" : "残高不足時の追加チャージ"}</h2>
                            <span className={`rounded-full px-3 py-1 text-sm ${rule?.status === "active" ? "bg-emerald-50 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{rule ? labels[rule.status] || "状態を確認してください" : "未設定"}</span>
                        </div>
                        {rule ? <dl className="grid w-full grid-cols-2 gap-x-4 gap-y-3 text-sm">
                            <dt className="text-muted-foreground">1 回のチャージ金額</dt>
                            <dd className="text-right font-medium">{yen(rule.amount)}</dd>
                            {type === "monthly" ? <>
                                <dt className="text-muted-foreground">チャージ日</dt>
                                <dd className="text-right">毎月 {rule.billingDay} 日（日本時間）</dd>
                                {rule.status === "active" && rule.nextChargeAt && <>
                                    <dt className="text-muted-foreground">次回予定</dt>
                                    <dd className="text-right">{new Intl.DateTimeFormat("ja-JP", {
                                        timeZone: "Asia/Tokyo",
                                        dateStyle: "medium"
                                    }).format(new Date(rule.nextChargeAt))}</dd>
                                </>}</> : <>
                                <dt className="text-muted-foreground">追加チャージの条件</dt>
                                <dd className="text-right">残高 {rule.thresholdCredits?.toLocaleString("ja-JP")} クレジット未満</dd>
                                <dt className="text-muted-foreground">追加チャージの月額上限</dt>
                                <dd className="text-right">{yen(rule.monthlyLimitAmount ?? 0)}</dd>
                            </>}
                        </dl> : <p className="text-sm text-muted-foreground">金額と条件を選び、Apple Pay
                            で承認してください。</p>}
                        {config &&
                            <button disabled={stopping || authorizing} className="rounded-lg border px-4 py-2 text-sm"
                                onClick={() => {
                                    setEditing(editing === type ? null : type);
                                    setNotice("");
                                }}>{editing === type ? "閉じる" : rule ? "設定を変更・再承認" : "設定する"}</button>}
                        {editing === type && config && <ChargeEditor key={type} type={type} rule={rule} config={config}
                                                             onBusy={setAuthorizing} onPrepared={pending => {
                            setSettings(current => [...current.filter(item => item.type !== pending.type), pending]);
                            setNotice("Apple Pay での承認を完了してください。完了するまで、この種類の自動チャージは停止しています。");
                        }}
                         onSaved={rules => {
                             setSettings(rules);
                             setEditing(null);
                             setNotice("Apple Pay の承認が完了し、設定を保存しました。");
                         }}/>}
                        {rule?.lastError && <p className="text-sm text-destructive">{rule.lastError}</p>}
                        {rule && rule.status !== "disabled" &&
                            <button className="rounded-lg border px-4 py-2 text-sm text-destructive hover:bg-muted"
                                onClick={() => setConfirm(rule)}
                                disabled={stopping || authorizing}>この自動チャージを停止</button>}
                    </section>;
                }) : null}
            <p className="text-sm text-muted-foreground">追加チャージの月額上限には、手動チャージと毎月のチャージは含まれません。停止しても、すでに処理中のお支払いは取り消されない場合があります。</p>
            <dialog ref={dialog} onCancel={event => {
                event.preventDefault();
                if (!stopping) setConfirm(null);
            }} aria-labelledby="stop-title" aria-describedby="stop-description"
                    className="fixed inset-0 m-auto w-[calc(100%-2.5rem)] max-w-md space-y-5 rounded-2xl bg-background p-6 text-foreground shadow-xl backdrop:bg-black/40">{confirm && <>
                <h2 id="stop-title" className="text-lg font-semibold">自動チャージを停止しますか？</h2><p
                id="stop-description"
                className="text-sm text-muted-foreground">{confirm.type === "monthly" ? "毎月のチャージ" : "残高不足時の追加チャージ"}を停止します。処理中のお支払いは取り消されません。</p>
                <div className="flex justify-end gap-3">
                    <button autoFocus disabled={stopping || authorizing} className="rounded-lg border px-4 py-2"
                        onClick={() => setConfirm(null)}>キャンセル
                    </button>
                    <button disabled={stopping || authorizing}
                        className="rounded-lg bg-destructive px-4 py-2 text-white"
                        onClick={() => void stop()}>{stopping ? "停止しています…" : "停止する"}</button>
                </div>
            </>}</dialog>
        </div>
    </div>;
}

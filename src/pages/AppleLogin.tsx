import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE, setToken } from "@/lib/auth";
import { beginAppleLogin, readAppleResult, clearAppleFlow, type AppleConfig } from "@/lib/apple-login";
import "./AppleLogin.css";

declare global {
    interface Window {
        AppleID?: {
            auth: {
                init: (config: { clientId: string; redirectURI: string }) => void;
                signIn: (config: { state: string; nonce: string; usePopup: true }) => Promise<unknown>;
            };
        };
    }
}

export function AppleLogin() {
    const [config, setConfig] = useState<AppleConfig | null>(null);
    const [sdkReady, setSdkReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [loadFailed, setLoadFailed] = useState(false);
    const [wrongOrigin, setWrongOrigin] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        let active = true;
        const controller = new AbortController();

        void fetch(`${API_BASE}/auth/apple/start`, { method: "POST", signal: controller.signal })
            .then(async response => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "ログインを開始できませんでした。");
                if (typeof data.clientID !== "string" || typeof data.redirectURI !== "string") throw new Error("ログイン設定が無効です。");

                return data as AppleConfig;
            }).then(settings => {
                if (!active) return;
                setConfig(settings);

                if (location.origin !== new URL(settings.redirectURI).origin) {
                    setWrongOrigin(true);
                    setError("Apple ログインは admin.japanese-learning.makoto.lol からご利用ください。");
                }
            }).catch(cause => {
                if (active) {
                    setError(cause instanceof Error ? cause.message : "接続できませんでした。");
                    setLoadFailed(true);
                }
            });

        return () => { active = false; controller.abort(); };
    }, []);

    useEffect(() => {
        if (!config || wrongOrigin) return;
        let active = true;
        const initialize = () => {
            if (!window.AppleID) return;

            try {
                window.AppleID.auth.init({
                    clientId: config.clientID,
                    redirectURI: config.redirectURI
                });

                if (active) setSdkReady(true);
            } catch {
                if (active) { setError("Apple ログインを準備できませんでした。"); setLoadFailed(true); }
            }
        };

        if (window.AppleID) initialize();
        else {
            const script = document.createElement("script");
            script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/ja_JP/appleid.auth.js";
            script.async = true;
            script.onload = initialize;
            script.onerror = () => {
                if (active) {
                    setError("Apple ログインを読み込めませんでした。");
                    setLoadFailed(true);
                }
            };
            document.head.appendChild(script);
        }

        return () => { active = false; };
    }, [config, wrongOrigin]);

    async function signIn() {
        if (busy || !sdkReady || !window.AppleID) return;
        setBusy(true);
        setError("");

        try {
            const flow = beginAppleLogin();
            const response = await window.AppleID.auth.signIn({ ...flow, usePopup: true });
            const result = readAppleResult(response);
            if (!result.body) throw new Error(result.error || "ログインに失敗しました。");

            const loginResponse = await fetch(`${API_BASE}/auth/apple/callback`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(result.body),
                signal: AbortSignal.timeout(20000)
            });

            const data = await loginResponse.json();
            if (!loginResponse.ok || typeof data.sessionToken !== "string") throw new Error(data.error || "ログインに失敗しました。");

            clearAppleFlow();
            setToken(data.sessionToken);
            navigate("/", { replace: true });
        } catch (cause) {
            clearAppleFlow();
            const code = cause && typeof cause === "object" && "error" in cause ? cause.error : "";
            setError(code === "user_cancelled_authorize" ? "ログインがキャンセルされました。" : cause instanceof Error ? cause.message : "ログインに失敗しました。もう一度お試しください。");
            setBusy(false);
        }
    }

    return (
        <main className="apple-login">
            <div className="login-card">
                <h1>日本語学習</h1><p>App と同じ Apple アカウントでログイン</p>
                <button type="button" className="apple-signin" onClick={signIn} disabled={busy || !sdkReady || wrongOrigin}>
                    {busy ? "ログイン中…" : wrongOrigin ? "オンラインサイトからログイン" : !sdkReady ? "読み込み中…" : (
                        <img
                            src="https://appleid.cdn-apple.com/appleid/button?height=44&width=320&color=black&border=false&type=sign-in&border_radius=8&scale=2&locale=ja_JP"
                            alt="Appleでサインイン"
                        />
                    )}
                </button>
                {error && <p className="login-error" role="alert">{error}</p>}
                {loadFailed && <button type="button" onClick={() => location.reload()}>再読み込み</button>}
            </div>
        </main>
    );
}

import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { API_BASE, apiFetch, getToken } from "@/lib/auth";
import "./RequireAuth.css";

export function RequireAuth() {
    const [status, setStatus] = useState<"loading" | "ready" | "login" | "error">(getToken() ? "loading" : "login");
    useEffect(() => {

        if (!getToken()) return;
        const controller = new AbortController();
        void apiFetch(`${API_BASE}/users`, { signal: controller.signal })
            .then(response => setStatus(response.ok ? "ready" : response.status === 401 ? "login" : "error"))
            .catch(() => { if (!controller.signal.aborted) setStatus("error"); });

        return () => controller.abort();
    }, []);

    if (status === "login") return <Navigate to="/login" replace />;
    if (status === "loading") return (
        <div className="auth-check-overlay" role="status" aria-live="polite" aria-busy="true">
            <div className="auth-check-dialog">
                <span className="auth-check-spinner" aria-hidden="true" />
                <p>ログインを確認しています…</p>
            </div>
        </div>
    );
    if (status === "error") return <div><p>接続できませんでした。</p><button onClick={() => location.reload()}>再試行</button></div>;

    return <Outlet />;
}

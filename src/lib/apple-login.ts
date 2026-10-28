export type AppleConfig = { clientID: string; redirectURI: string };
const key = "apple-login-flow";
const random = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join("");
type FlowStorage = Pick<Storage, "setItem" | "getItem" | "removeItem">;

export function beginAppleLogin(origin = location.origin, storage: FlowStorage = sessionStorage) {
    const state = btoa(JSON.stringify({ origin, requestID: random(), mode: "inline" })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
    const nonce = random();
    storage.setItem(key, JSON.stringify({ state, nonce }));

    return { state, nonce };
}

export function readAppleResult(data: unknown, storage: FlowStorage = sessionStorage): { body?: { authorizationCode: string; hashedNonce: string }; error?: string } {
    try {
        if (!data || typeof data !== "object") throw new Error("invalid result");

        const result = data as {
            authorization?: {
                state?: unknown;
                code?: unknown
            };
            state?: unknown;
            code?: unknown;
            error?: unknown
        };
        const expected = JSON.parse(storage.getItem(key) || "null");
        const authorization = result.authorization || result;
        if (!expected || authorization.state !== expected.state) {
            return { error: "ログイン情報が一致しません。もう一度お試しください。" };
        }

        if (result.error) {
            return {
                error: result.error === "user_cancelled_authorize" ? "ログインがキャンセルされました。" : "ログインに失敗しました。もう一度お試しください。"
            };
        }
        if (typeof authorization.code !== "string" || !authorization.code) return { error: "ログイン結果が無効です。" };

        return {
            body: {
                authorizationCode: authorization.code,
                hashedNonce: expected.nonce
            }
        };
    } catch {
        return { error: "ログインをやり直してください。" };
    }
}

export function clearAppleFlow(storage: FlowStorage = sessionStorage) {
    storage.removeItem(key);
}

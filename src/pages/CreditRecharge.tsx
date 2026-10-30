import { useEffect, useMemo, useState } from "react";
import { Elements, ExpressCheckoutElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type StripeExpressCheckoutElementConfirmEvent } from "@stripe/stripe-js";
import { API_BASE, apiFetch } from "@/lib/auth";

type CreditProduct = {
    id: string;
    credits: number;
    appStoreProductID: string;
    stripeAmount: number;
    stripeCurrency: string;
};

type StripeConfig = { publishableKey: string; country: string; currency: string };

function yen(amount: number) {
    return new Intl.NumberFormat("ja-JP", {
        style: "currency", currency: "JPY", maximumFractionDigits: 0
    }).format(amount);
}

function PaymentButton({ product, onPaid, onError }: {
    product: CreditProduct;
    onPaid: () => Promise<void>;
    onError: (message: string) => void;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [available, setAvailable] = useState(false);
    const [paying, setPaying] = useState(false);

    async function confirmPayment(event: StripeExpressCheckoutElementConfirmEvent) {
        if (!stripe || !elements || paying) return;
        setPaying(true);
        onError("");

        try {
            const submitted = await elements.submit();
            if (submitted.error) throw new Error(submitted.error.message || "お支払い情報を確認できませんでした。");

            const createResponse = await apiFetch(`${API_BASE}/payments/stripe/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credits: product.credits, requestID: crypto.randomUUID() })
            });
            const createData = await createResponse.json();
            if (!createResponse.ok || typeof createData.clientSecret !== "string") {
                throw new Error(createData.error || "決済を開始できませんでした。");
            }

            const result = await stripe.confirmPayment({
                elements,
                clientSecret: createData.clientSecret,
                confirmParams: { return_url: `${location.origin}/credits?payment=complete` },
                redirect: "if_required"
            });

            if (result.error) throw new Error(result.error.message || "決済に失敗しました。");
            if (result.paymentIntent?.status === "succeeded") {
                await onPaid();
                return;
            }
            if (result.paymentIntent?.status === "processing") {
                onError("決済を確認しています。残高への反映まで少しお待ちください。");
                return;
            }
            throw new Error("決済が完了していません。もう一度お試しください。");
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : "決済を完了できませんでした。";
            onError(message);
            event.paymentFailed({ reason: "fail", message });
        } finally {
            setPaying(false);
        }
    }

    return (
        <div className="space-y-3">
            <ExpressCheckoutElement
                options={{
                    buttonType: {
                        applePay: "plain"
                    },
                    buttonHeight: 48,
                    paymentMethods: {
                        applePay: "always",
                        googlePay: "never",
                        link: "never",
                        paypal: "never",
                        amazonPay: "never",
                        klarna: "never"
                    },
                    layout: {
                        maxColumns: 1,
                        maxRows: 1,
                        overflow: "auto"
                    }
                }}
                onConfirm={event => { void confirmPayment(event); }}
                onReady={event => setAvailable(Boolean(event.availablePaymentMethods?.applePay))}
                onAvailablePaymentMethodsChange={event => setAvailable(Boolean(event.paymentMethods?.applePay?.available))}
                onLoadError={() => onError("Apple Pay を読み込めませんでした。")}
            />
            {!available && <p className="text-center text-sm text-muted-foreground">Apple Pay は Apple Pay 対応の端末・ブラウザで表示されます。</p>}
            {paying && <p className="text-center text-sm text-muted-foreground" role="status">決済を確認しています…</p>}
        </div>
    );
}

export function CreditRecharge() {
    const [products, setProducts] = useState<CreditProduct[]>([]);
    const [selectedID, setSelectedID] = useState("");
    const [stripeConfig, setStripeConfig] = useState<StripeConfig | null>(null);
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const selected = products.find(product => product.id === selectedID) || products[0];
    const stripePromise = useMemo(() => stripeConfig ? loadStripe(stripeConfig.publishableKey) : null, [stripeConfig]);

    useEffect(() => {
        let active = true;
        void Promise.all([
            apiFetch(`${API_BASE}/credit_products`).then(async response => {
                const data = await response.json();
                if (!response.ok || !Array.isArray(data.products)) throw new Error(data.error || "商品を読み込めませんでした。");

                return data.products as CreditProduct[];
            }),
            apiFetch(`${API_BASE}/payments/stripe/config`, { method: "POST" }).then(async response => {
                const data = await response.json();
                if (!response.ok || typeof data.publishableKey !== "string") throw new Error(data.error || "決済の設定を読み込めませんでした。");

                return data as StripeConfig;
            }),
            apiFetch(`${API_BASE}/users`).then(async response => {
                const data = await response.json();
                if (!response.ok || typeof data.creditBalance !== "number") throw new Error(data.error || "残高を読み込めませんでした。");

                return data.creditBalance as number;
            })
        ]).then(([items, paymentConfig, currentBalance]) => {
            if (!active) return;
            setProducts(items);
            setSelectedID(items[0]?.id || "");
            setStripeConfig(paymentConfig);
            setBalance(currentBalance);
        }).catch(cause => {
            if (active) setError(cause instanceof Error ? cause.message : "情報を読み込めませんでした。");
        }).finally(() => { if (active) setLoading(false); });

        return () => { active = false; };
    }, []);

    async function reconcilePayment() {
        const response = await apiFetch(`${API_BASE}/payments/stripe/reconcile`, { method: "POST" });
        const data = await response.json();
        if (!response.ok || typeof data.creditBalance !== "number") throw new Error(data.error || "残高への反映を確認できませんでした。");
        setBalance(data.creditBalance);
        setNotice("チャージが完了しました。");
    }

    return (
        <div className="w-full p-5 text-left sm:p-8">
            <div className="mx-auto w-full max-w-3xl space-y-6">
                <header>
                    <h1 className="mb-2 text-3xl font-semibold tracking-tight sm:text-4xl">クレジットチャージ</h1>
                    <p className="text-muted-foreground">チャージするクレジットを選び、Apple Pay でお支払いください。</p>
                </header>

                {balance !== null && (
                    <div className="rounded-xl border bg-card px-5 py-4 shadow-sm">
                        <p className="text-sm text-muted-foreground">現在の残高</p>
                        <p className="mt-1 flex items-baseline gap-2 font-semibold">
                            <span className="text-2xl">{balance.toLocaleString("ja-JP")}</span>
                            <span className="text-base">クレジット</span>
                        </p>
                    </div>
                )}

                {stripeConfig?.publishableKey.startsWith("pk_test_") && (
                    <p className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        テスト決済モードです。実際の請求は発生しません。
                    </p>
                )}

                {loading ? (
                    <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground" role="status">商品を読み込んでいます…</div>
                ) : error ? (
                    <div className="rounded-xl border bg-card p-6">
                        <p className="text-destructive" role="alert">{error}</p>
                        <button type="button" className="mt-4 rounded-md border px-4 py-2 text-sm hover:bg-muted" onClick={() => location.reload()}>再読み込み</button>
                    </div>
                ) : products.length === 0 ? (
                    <div className="rounded-xl border bg-card p-6 text-muted-foreground">現在、購入できる商品はありません。</div>
                ) : selected && stripePromise ? (
                    <section className="space-y-5 rounded-xl border bg-card p-5 shadow-sm sm:p-7">
                        <div>
                            <h2 className="text-lg font-semibold">商品を選択</h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {products.map(product => {
                                    const active = product.id === selected.id;
                                    return (
                                        <button
                                            type="button"
                                            key={product.id}
                                            onClick={() => { setSelectedID(product.id); setNotice(""); setError(""); }}
                                            className={`flex items-center justify-between rounded-lg border p-4 text-left transition-colors ${active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/40"}`}
                                            aria-pressed={active}
                                        >
                                            <span>
                                                <span className="block font-semibold">{product.credits.toLocaleString("ja-JP")} クレジット</span>
                                                <span className="mt-1 block text-sm text-muted-foreground">日本語学習クレジット</span>
                                            </span>
                                            <span className="ml-3 whitespace-nowrap text-lg font-semibold">{yen(product.stripeAmount)}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="border-t pt-5">
                            <div className="mb-4 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">お支払い金額</span>
                                <strong className="text-lg">{yen(selected.stripeAmount)}</strong>
                            </div>
                            <Elements
                                key={selected.id}
                                stripe={stripePromise}
                                options={{
                                    mode: "payment",
                                    amount: selected.stripeAmount,
                                    currency: selected.stripeCurrency.toLowerCase(),
                                    allowedPaymentMethodTypes: ["card"],
                                    locale: "ja",
                                    appearance: { theme: "stripe", variables: { borderRadius: "8px" } }
                                }}
                            >
                                <PaymentButton product={selected} onPaid={reconcilePayment} onError={setError} />
                            </Elements>
                            {error && <p className="mt-4 text-sm text-destructive" role="alert">{error}</p>}
                            {notice && <p className="mt-4 text-center text-sm font-medium text-emerald-700" role="status">{notice}{balance !== null ? ` 残高: ${balance.toLocaleString("ja-JP")} クレジット` : ""}</p>}
                        </div>
                    </section>
                ) : null}

                <p className="text-sm text-muted-foreground">お支払いとクレジットの追加は Stripe の決済確認後に処理されます。</p>
            </div>
        </div>
    );
}

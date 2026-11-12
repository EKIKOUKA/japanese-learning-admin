import {useMemo, useRef, useState} from "react";
import {Elements, ExpressCheckoutElement, useElements, useStripe} from "@stripe/react-stripe-js";
import {
    loadStripe,
    type StripeExpressCheckoutElementOptions,
    type StripeExpressCheckoutElementConfirmEvent
} from "@stripe/stripe-js";
import {chargeRequest} from "@/lib/automatic-charge";

export type ChargeKind = "monthly" | "low_balance";
export type ChargeRule = {
    id: string;
    type: ChargeKind;
    status: string;
    amount: number;
    billingDay: number | null;
    nextChargeAt: string | null;
    thresholdCredits: number | null;
    monthlyLimitAmount: number | null;
    lastError: string | null;
};
export type ChargeConfig = {
    publishableKey: string;
    currency: string;
    options: {
        amount: number;
        credits: number
    }[]
};
type Authorization = {
    clientSecret: string;
    authorizationID: string;
    managementURL: string;
    thresholdAmount: number | null;
    setting: ChargeRule
};
const yen = (amount: number) => `¥${amount.toLocaleString("ja-JP")}`;

function AuthorizeButton({authorization, onSaved, onBusy}: {
    authorization: Authorization;
    onSaved: (rules: ChargeRule[]) => void;
    onBusy: (busy: boolean) => void
}) {
    const stripe = useStripe();
    const elements = useElements();
    const busyRef = useRef(false);
    const [busy, setBusy] = useState(false);
    const [ready, setReady] = useState(false);
    const [available, setAvailable] = useState(false);
    const [error, setError] = useState("");
    const [confirmed, setConfirmed] = useState(false);
    const rule = authorization.setting;
    const billingAgreement = rule.type === "monthly"
        ? `日本時間の毎月 ${rule.billingDay} 日に ${yen(rule.amount)} をチャージします。\nチャージで受け取れるクレジット数は変更される場合があります。管理ページから停止できます。`
        : `残高が ${rule.thresholdCredits?.toLocaleString("ja-JP")} クレジット未満になると ${yen(rule.amount)} を追加します。\n追加チャージの上限は日本時間の毎月 ${yen(rule.monthlyLimitAmount ?? 0)} です。手動・毎月のチャージは含みません。\nチャージで受け取れるクレジット数は変更される場合があります。円表示は目安で、実際はクレジット数で判定します。承認直後も残高が少ない場合は追加します。管理ページから停止できます。`;
    const applePay: StripeExpressCheckoutElementOptions["applePay"] = rule.type === "monthly" ? {
        recurringPaymentRequest: {
            paymentDescription: "ことね 毎月のチャージ", managementURL: authorization.managementURL, billingAgreement,
            regularBilling: {
                label: "毎月のクレジットチャージ",
                amount: rule.amount,
                recurringPaymentIntervalUnit: "month",
                recurringPaymentIntervalCount: 1,
                ...(rule.nextChargeAt ? {recurringPaymentStartDate: new Date(rule.nextChargeAt)} : {})
            }
        }
    } : {
        automaticReloadPaymentRequest: {
            paymentDescription: "ことね 追加チャージ", managementURL: authorization.managementURL, billingAgreement,
            automaticReloadBilling: {
                label: "残高不足時の追加チャージ",
                amount: rule.amount,
                automaticReloadPaymentThresholdAmount: authorization.thresholdAmount ?? 1
            }
        }
    };

    async function complete(event?: StripeExpressCheckoutElementConfirmEvent) {
        if (busyRef.current || !stripe || !elements) return;
        busyRef.current = true;
        setBusy(true);
        onBusy(true);
        setError("");
        let setupSucceeded = confirmed;

        try {
            if (!confirmed) {
                const submitted = await elements.submit();
                if (submitted.error) throw new Error(submitted.error.message || "承認情報を確認できませんでした。");
                const result = await stripe.confirmSetup({
                    elements, clientSecret: authorization.clientSecret,
                    confirmParams: {return_url: `${location.origin}/credits/automatic`}, redirect: "if_required"
                });
                if (result.error) throw new Error(result.error.message || "承認に失敗しました。");
                if (result.setupIntent?.status !== "succeeded") throw new Error("承認はまだ完了していません。設定を再読み込みして確認してください。");
                setConfirmed(true);
                setupSucceeded = true;
            }
            const data = await chargeRequest("complete", {authorizationID: authorization.authorizationID});
            onSaved(data.settings);
        } catch (cause) {
            const message = cause instanceof Error ? cause.message : "承認を完了できませんでした。";
            setError(message);
            if (!setupSucceeded) event?.paymentFailed({reason: "fail", message});
        } finally {
            busyRef.current = false;
            setBusy(false);
            onBusy(false);
        }
    }

    return <div className="flex w-full flex-col gap-3">
        <p className="whitespace-pre-line text-sm text-muted-foreground">{billingAgreement}</p>
        {
            !confirmed && <ExpressCheckoutElement options={{
                applePay, buttonType: {applePay: "plain"}, buttonHeight: 48,
                paymentMethods: {
                    applePay: "always",
                    googlePay: "never",
                    link: "never",
                    paypal: "never",
                    amazonPay: "never",
                    klarna: "never"
                }
            }}
            onConfirm={event => void complete(event)} onReady={event => {
                setReady(true);
                setAvailable(Boolean(event.availablePaymentMethods?.applePay));
            }}
            onAvailablePaymentMethodsChange={event => setAvailable(Boolean(event.paymentMethods?.applePay?.available))}
            onLoadError={() => {
               setReady(true);
               setError("Apple Pay を読み込めませんでした。対応端末・ブラウザで再度お試しください。");
            }}/>
        }
        {!ready && !confirmed &&
            <p role="status" className="text-sm text-muted-foreground">Apple Pay を読み込んでいます…</p>}
        {ready && !available && !confirmed &&
            <p className="text-sm text-muted-foreground">
                Apple Pay 対応の端末・ブラウザで開き、Wallet にカードを登録してください。
            </p>
        }
        {busy && <p role="status" className="text-sm">承認を確認しています…</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {confirmed && <button disabled={busy} className="rounded-lg border px-4 py-2"
          onClick={() => void complete()}>承認結果を再確認</button>}
    </div>;
}

export function ChargeEditor({type, rule, config, onSaved, onPrepared, onBusy}: {
    type: ChargeKind; rule?: ChargeRule; config: ChargeConfig;
    onSaved: (rules: ChargeRule[]) => void; onPrepared: (rule: ChargeRule) => void; onBusy: (busy: boolean) => void;
}) {
    const options = config.options.filter(item => item.amount <= 20000 && (type === "monthly" || item.amount >= 50));
    const [amount, setAmount] = useState(options.find(item => item.amount === rule?.amount)?.amount ?? options[0]?.amount ?? 0);
    const [day, setDay] = useState(rule?.billingDay ?? 1);
    const [threshold, setThreshold] = useState(String(rule?.thresholdCredits ?? 100));
    const [limit, setLimit] = useState(String(rule?.monthlyLimitAmount ?? Math.max(1000, amount)));
    const [authorization, setAuthorization] = useState<Authorization | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const retry = useRef<{ signature: string; id: string } | null>(null);
    const stripe = useMemo(() => loadStripe(config.publishableKey), [config.publishableKey]);
    const integer = (text: string, min: number) => /^\d+$/.test(text) && Number.isSafeInteger(Number(text)) && Number(text) >= min && Number(text) <= 20000;
    const valid = options.some(item => item.amount === amount) && (type === "monthly" || integer(threshold, 50) && integer(limit, Math.max(50, amount)));

    async function prepare() {
        if (busy || !valid) return;
        setBusy(true);
        onBusy(true);
        setError("");
        const body = type === "monthly" ? {type, amount, billingDay: day} : {
            type,
            amount,
            thresholdCredits: Number(threshold),
            monthlyLimitAmount: Number(limit)
        };
        const signature = JSON.stringify(body);
        if (retry.current?.signature !== signature) retry.current = {signature, id: crypto.randomUUID()};
        try {
            const data: Authorization = await chargeRequest("prepare", {...body, requestID: retry.current.id});
            setAuthorization(data);
            onPrepared(data.setting);
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : "設定を準備できませんでした。");
        } finally {
            setBusy(false);
            onBusy(false);
        }
    }

    const field = "mt-2 block w-full rounded-lg border bg-background p-3 text-sm";
    return <div className="flex w-full flex-col items-start gap-4 border-t pt-5">
        <fieldset disabled={busy || Boolean(authorization)} className="flex w-full flex-col gap-4 disabled:opacity-70">
            <label className="block text-sm font-medium">
                {type === "monthly" ? "毎月の金額" : "1 回の金額"}
                <select className={field} value={amount}
                    onChange={event => setAmount(Number(event.target.value))}>
                    {options.map(item => <option key={item.amount} value={item.amount}>
                    {yen(item.amount)} · {item.credits.toLocaleString("ja-JP")} クレジット</option>)}
                </select>
            </label>
            {type === "monthly" ?
                <label className="block text-sm font-medium">チャージ日
                    <select className={field} value={day}
                            onChange={event => setDay(Number(event.target.value))}>{Array.from({length: 28}, (_, index) =>
                        <option key={index} value={index + 1}>毎月 {index + 1} 日（日本時間）</option>)}
                    </select>
                </label> : <>
                <label className="block text-sm font-medium">この残高を下回ると追加（クレジット）
                    <input className={field} type="number" inputMode="numeric" min={50} max={20000} step={1}
                        value={threshold} onChange={event => setThreshold(event.target.value)}/>
                </label>
                <label className="block text-sm font-medium">追加チャージの月額上限（円）
                    <input className={field}
                       type="number"
                       inputMode="numeric"
                       min={Math.max(50, amount)}
                       max={20000} step={1}
                       value={limit}
                       onChange={event => setLimit(event.target.value)}
                    />
                </label>
                 {!valid && <p className="text-sm text-destructive">残高は 50〜20,000 クレジット、月額上限は 1 回の金額以上かつ
                    50〜20,000 円の整数で入力してください。</p>}
                </>
            }
        </fieldset>
        <p className="text-sm text-muted-foreground">
            {type === "monthly" ? "次の指定日からチャージします。登録時の請求はありません。" : "現在の総残高で判定します。承認直後も残高が少ない場合は追加します。"}
            変更には Apple Pay での再承認が必要です。
        </p>
        {!authorization ? <>
            <p className="text-sm text-muted-foreground">準備を開始すると、現在の設定は新しい承認が完了するまで停止します。</p>
            <button disabled={!valid || busy}
                className="rounded-lg bg-primary px-5 py-3 text-sm text-primary-foreground disabled:opacity-50"
                onClick={() => void prepare()}>{busy ? "準備しています…" : "この内容で Apple Pay の承認へ"}
            </button>
        </> : <Elements key={authorization.authorizationID} stripe={stripe} options={{
            mode: "setup",
            currency: "jpy",
            allowedPaymentMethodTypes: ["card"],
            locale: "ja"
        }}><AuthorizeButton authorization={authorization} onSaved={onSaved} onBusy={onBusy}/></Elements>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>;
}

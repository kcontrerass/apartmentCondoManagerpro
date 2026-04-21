"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { downloadPlatformSubscriptionReceiptPdf } from "@/lib/download-platform-subscription-pdf";
import { PLATFORM_CARD_CHECKOUT_SESSION_KEY } from "@/lib/platform-card-checkout-session";
import { PLATFORM_SUBSCRIPTION_TERMS_VERSION } from "@/lib/platform-subscription-terms";
import { canPayPlatformSubscriptionRole } from "@/lib/platform-subscription-rules";
import { toast } from "sonner";

type PendingBankTransferPayload = {
    paymentId: string;
    reference: string;
    instructions: string;
    amountGtq: number;
    currency: string;
    periodMonths: number;
    proofPhone: string | null;
};

type StatusPayload = {
    role: string;
    complexName?: string;
    platformPaidUntil?: string | null;
    priceGtq: number;
    periodMonths: number;
    keysConfigured: boolean;
    bankTransferConfigured?: boolean;
    subscriptionProofPhone?: string | null;
    canInitiatePayment?: boolean;
    paymentBlockReason?: "PENDING" | "PAID_THIS_MONTH" | null;
    pendingPaymentMethod?: string | null;
    pendingBankTransfer?: PendingBankTransferPayload | null;
    subscriptionTermsVersion?: string;
};

type TransferPayload = {
    paymentId: string;
    instructions: string;
    amountGtq: number;
    currency: string;
    periodMonths: number;
    reference: string;
    proofPhone?: string | null;
};

type HistoryInvoice = {
    id: string;
    number: string;
    month: number;
    year: number;
    status: string;
};

type HistoryRow = {
    id: string;
    status: string;
    paymentMethod: string;
    amountCents: number;
    currency: string;
    paidAt: string | null;
    createdAt: string;
    periodMonths: number;
    invoice: HistoryInvoice | null;
};

export function PlatformSubscriptionClient() {
    const t = useTranslations("PlatformSubscription");
    const locale = useLocale();
    const [data, setData] = useState<StatusPayload | null | undefined>(undefined);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [payingCard, setPayingCard] = useState(false);
    const [creatingTransfer, setCreatingTransfer] = useState(false);
    const [transferDetails, setTransferDetails] = useState<TransferPayload | null>(null);
    const [history, setHistory] = useState<HistoryRow[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [pdfInvoiceId, setPdfInvoiceId] = useState<string | null>(null);
    const [releasingCard, setReleasingCard] = useState(false);

    const loadHistory = useCallback(async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch("/api/platform-fee/my-payments");
            const json = await res.json();
            if (res.ok && json?.data?.payments) {
                setHistory(json.data.payments as HistoryRow[]);
            }
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/platform-fee/status");
                const json = await res.json();
                if (!cancelled && res.ok && json?.data) {
                    setData(json.data);
                } else if (!cancelled) {
                    setData(null);
                    if (!res.ok) toast.error(json?.error?.message || t("errorCheckout"));
                }
            } catch {
                if (!cancelled) {
                    setData(null);
                    toast.error(t("errorCheckout"));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [t]);

    const reloadStatus = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/platform-fee/status");
            const json = await res.json();
            if (res.ok && json?.data) {
                setData(json.data);
            } else {
                setData(null);
                if (!res.ok) toast.error(json?.error?.message || t("errorCheckout"));
            }
        } catch {
            setData(null);
            toast.error(t("errorCheckout"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    /**
     * Tras «atrás» desde Recurrente, la misma pestaña vuelve aquí; Recurrente suele dejar el checkout abierto.
     * El flag en sessionStorage prueba que el usuario salió del flujo iniciado aquí (no polling agresivo en servidor).
     */
    useEffect(() => {
        const syncAfterHostedCheckoutReturn = () => {
            if (typeof window === "undefined") return;
            if (!sessionStorage.getItem(PLATFORM_CARD_CHECKOUT_SESSION_KEY)) return;
            return (async () => {
                try {
                    const res = await fetch("/api/platform-fee/sync-after-card-return", { method: "POST" });
                    if (res.ok) {
                        await reloadStatus();
                        void loadHistory();
                    }
                } finally {
                    try {
                        sessionStorage.removeItem(PLATFORM_CARD_CHECKOUT_SESSION_KEY);
                    } catch {
                        /* ignore */
                    }
                }
            })();
        };

        void syncAfterHostedCheckoutReturn();

        const onPageShow = (e: PageTransitionEvent) => {
            if (e.persisted) void syncAfterHostedCheckoutReturn();
        };
        window.addEventListener("pageshow", onPageShow);
        return () => window.removeEventListener("pageshow", onPageShow);
    }, [reloadStatus, loadHistory]);

    useEffect(() => {
        if (!canPayPlatformSubscriptionRole(data?.role)) return;
        void loadHistory();
    }, [data?.role, loadHistory]);

    useEffect(() => {
        setTermsAccepted(false);
    }, [data?.subscriptionTermsVersion]);

    /** Mantener visibles monto e instrucciones bancarias con transferencia pendiente (p. ej. tras recargar la página). */
    useEffect(() => {
        if (!data) return;
        const pb = data.pendingBankTransfer;
        if (pb) {
            setTransferDetails({
                paymentId: pb.paymentId,
                instructions: pb.instructions,
                amountGtq: pb.amountGtq,
                currency: pb.currency,
                periodMonths: pb.periodMonths,
                reference: pb.reference,
                proofPhone: pb.proofPhone,
            });
            return;
        }
        if (data.paymentBlockReason === "PENDING" && data.pendingPaymentMethod === "BANK_TRANSFER") {
            return;
        }
        if (
            data.canInitiatePayment ||
            data.paymentBlockReason === "PAID_THIS_MONTH" ||
            (data.paymentBlockReason === "PENDING" && data.pendingPaymentMethod === "CARD")
        ) {
            setTransferDetails(null);
        }
    }, [data]);

    const handleReleaseCardAttempt = async () => {
        setReleasingCard(true);
        try {
            const res = await fetch("/api/platform-fee/release-pending-card", { method: "POST" });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json?.error?.message || t("releaseCardError"));
                return;
            }
            toast.success(t("releaseCardSuccess"));
            await reloadStatus();
            void loadHistory();
        } catch {
            toast.error(t("releaseCardError"));
        } finally {
            setReleasingCard(false);
        }
    };

    const handleDownloadSubscriptionPdf = async (invoiceId: string) => {
        setPdfInvoiceId(invoiceId);
        try {
            const { error } = await downloadPlatformSubscriptionReceiptPdf(invoiceId);
            if (error) toast.error(error);
        } catch {
            toast.error(t("errorCheckout"));
        } finally {
            setPdfInvoiceId(null);
        }
    };

    const handlePayCard = async () => {
        setPayingCard(true);
        try {
            const termsVersion =
                data?.subscriptionTermsVersion ?? PLATFORM_SUBSCRIPTION_TERMS_VERSION;
            const res = await fetch("/api/platform-fee/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    method: "CARD",
                    acceptTerms: true,
                    termsVersion,
                }),
            });
            const json = await res.json();
            if (!res.ok || !json?.data?.url) {
                toast.error(json?.error?.message || t("errorCheckout"));
                return;
            }
            try {
                sessionStorage.setItem(PLATFORM_CARD_CHECKOUT_SESSION_KEY, "1");
            } catch {
                /* modo privado / cuota */
            }
            window.location.href = json.data.url as string;
        } catch {
            toast.error(t("errorCheckout"));
        } finally {
            setPayingCard(false);
        }
    };

    const handlePayTransfer = async () => {
        setCreatingTransfer(true);
        setTransferDetails(null);
        try {
            const termsVersion =
                data?.subscriptionTermsVersion ?? PLATFORM_SUBSCRIPTION_TERMS_VERSION;
            const res = await fetch("/api/platform-fee/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    method: "BANK_TRANSFER",
                    acceptTerms: true,
                    termsVersion,
                }),
            });
            const json = await res.json();
            if (!res.ok || !json?.data || json.data.mode !== "BANK_TRANSFER") {
                toast.error(json?.error?.message || t("errorCheckout"));
                return;
            }
            const d = json.data;
            setTransferDetails({
                paymentId: d.paymentId,
                instructions: d.instructions,
                amountGtq: d.amountGtq,
                currency: d.currency,
                periodMonths: d.periodMonths,
                reference: d.reference,
                proofPhone: d.proofPhone ?? null,
            });
            toast.success(t("transferCreatedToast"));
            void loadHistory();
            await reloadStatus();
        } catch {
            toast.error(t("errorCheckout"));
        } finally {
            setCreatingTransfer(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    if (data === null) {
        return (
            <div className="space-y-6">
                <PageHeader title={t("title")} subtitle={t("subtitle")} />
                <Card className="p-6">
                    <p className="text-slate-600 dark:text-slate-400">{t("errorCheckout")}</p>
                </Card>
            </div>
        );
    }

    if (!data || !canPayPlatformSubscriptionRole(data.role)) {
        return (
            <div className="space-y-6">
                <PageHeader title={t("title")} subtitle={t("subtitle")} />
                <Card className="p-6">
                    <p className="text-slate-600 dark:text-slate-400">{t("noComplex")}</p>
                </Card>
            </div>
        );
    }

    const bankOk = !!data.bankTransferConfigured;
    const cardOk = data.keysConfigured;
    const canInitiatePayment = data.canInitiatePayment !== false;
    const blockedByTransferPending =
        data.paymentBlockReason === "PENDING" &&
        data.pendingPaymentMethod === "BANK_TRANSFER";
    const blockedByPaidThisMonth = data.paymentBlockReason === "PAID_THIS_MONTH";
    const payActionsDisabled =
        !canInitiatePayment ||
        !termsAccepted ||
        blockedByTransferPending ||
        blockedByPaidThisMonth;
    const blockMessage =
        data.paymentBlockReason === "PENDING"
            ? data.pendingPaymentMethod === "CARD"
                ? t("blockPendingCard")
                : t("blockPendingTransfer")
            : data.paymentBlockReason === "PAID_THIS_MONTH"
              ? t("blockPaidThisMonth")
              : null;

    const until = data.platformPaidUntil ? new Date(data.platformPaidUntil) : null;
    const canPay = bankOk || cardOk;

    const historyStatusLabel = (s: string) => {
        if (s === "PAID") return t("statusPaidShort");
        if (s === "CANCELLED") return t("statusCancelledShort");
        return t("statusPendingShort");
    };

    const historyMethodLabel = (m: string) =>
        m === "BANK_TRANSFER" ? t("methodTransferShort") : t("methodCardShort");

    return (
        <div className="space-y-6">
            <PageHeader title={t("title")} subtitle={t("subtitle")} />

            <Card className="p-6 space-y-4">
                <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t("historyTitle")}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t("historySubtitle")}</p>
                </div>
                {historyLoading ? (
                    <div className="flex justify-center py-8">
                        <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
                    </div>
                ) : history.length === 0 ? (
                    <p className="text-sm text-slate-500 dark:text-slate-400 py-2">{t("historyEmpty")}</p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 text-left text-slate-500">
                                    <th className="p-3 font-medium whitespace-nowrap">{t("historyColDate")}</th>
                                    <th className="p-3 font-medium whitespace-nowrap">{t("historyColPaidAt")}</th>
                                    <th className="p-3 font-medium">{t("historyColMonths")}</th>
                                    <th className="p-3 font-medium">{t("historyColAmount")}</th>
                                    <th className="p-3 font-medium">{t("historyColMethod")}</th>
                                    <th className="p-3 font-medium">{t("historyColStatus")}</th>
                                    <th className="p-3 font-medium">{t("historyColInvoice")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((r) => {
                                    const inv = r.invoice;
                                    return (
                                        <tr
                                            key={r.id}
                                            className="border-b border-slate-100 dark:border-slate-800/80 last:border-0"
                                        >
                                            <td className="p-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                {new Date(r.createdAt).toLocaleDateString(undefined, {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </td>
                                            <td className="p-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                                {r.paidAt
                                                    ? new Date(r.paidAt).toLocaleString(undefined, {
                                                          year: "numeric",
                                                          month: "short",
                                                          day: "numeric",
                                                      })
                                                    : "—"}
                                            </td>
                                            <td className="p-3 text-slate-900 dark:text-white">{r.periodMonths}</td>
                                            <td className="p-3 text-slate-900 dark:text-white whitespace-nowrap">
                                                Q{(r.amountCents / 100).toFixed(2)} {r.currency}
                                            </td>
                                            <td className="p-3 text-slate-600 dark:text-slate-400">
                                                {historyMethodLabel(r.paymentMethod)}
                                            </td>
                                            <td className="p-3">{historyStatusLabel(r.status)}</td>
                                            <td className="p-3">
                                                {inv ? (
                                                    <div className="space-y-1">
                                                        <p className="font-mono text-xs text-slate-700 dark:text-slate-300">
                                                            {inv.number}
                                                        </p>
                                                        <p className="text-xs text-slate-500">
                                                            {t("historyInvoicePeriod", {
                                                                month: inv.month,
                                                                year: inv.year,
                                                            })}
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            className="mt-1 min-h-[32px] text-xs gap-1 px-2 py-1 h-auto"
                                                            disabled={pdfInvoiceId === inv.id}
                                                            onClick={() => handleDownloadSubscriptionPdf(inv.id)}
                                                        >
                                                            {pdfInvoiceId === inv.id ? (
                                                                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                                            ) : (
                                                                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                                                            )}
                                                            {t("historyDownloadPdf")}
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">
                                                        {r.status === "PENDING"
                                                            ? t("historyInvoicePending")
                                                            : t("historyInvoiceNoUnits")}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {!canPay ? (
                <Card className="p-6 border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
                    <p className="text-amber-800 dark:text-amber-200 text-sm">{t("notConfigured")}</p>
                </Card>
            ) : (
                <Card className="p-6 space-y-6">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t("paidUntil")}</p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">
                            {until && !Number.isNaN(until.getTime())
                                ? until.toLocaleDateString(undefined, {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                  })
                                : t("none")}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <div>
                            <p className="text-sm text-slate-500">{t("priceLabel")}</p>
                            <p className="text-xl font-bold text-primary">Q{data.priceGtq.toFixed(2)} GTQ</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">{t("periodLabel", { months: data.periodMonths })}</p>
                            <p className="text-slate-700 dark:text-slate-300">{data.complexName}</p>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">{t("renewHint")}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{t("onePaymentPerMonthNote")}</p>

                    <label className="flex gap-3 items-start rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 px-4 py-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            aria-describedby="platform-subscription-terms-hint"
                        />
                        <span id="platform-subscription-terms-hint" className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                            {t("termsAcceptIntro")}{" "}
                            <Link
                                href={`/${locale}/legal/terms`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary font-medium underline underline-offset-2"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {t("termsLink")}
                            </Link>{" "}
                            {t("termsAcceptMiddle")}{" "}
                            <Link
                                href={`/${locale}/legal/legal-notice`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary font-medium underline underline-offset-2"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {t("legalLink")}
                            </Link>{" "}
                            {t("termsAcceptOutro")}
                        </span>
                    </label>
                    {!termsAccepted && (cardOk || bankOk) ? (
                        <p className="text-xs text-amber-700 dark:text-amber-300/90">{t("termsCheckboxHint")}</p>
                    ) : null}

                    {!canInitiatePayment && blockMessage && (
                        <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/25 px-4 py-3 space-y-3 text-sm text-amber-900 dark:text-amber-100">
                            <p>{blockMessage}</p>
                            {data?.paymentBlockReason === "PENDING" && data?.pendingPaymentMethod === "CARD" ? (
                                <div className="space-y-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/50">
                                    <p className="text-xs opacity-90">{t("releaseCardHint")}</p>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="min-h-[40px] text-xs border-amber-300 dark:border-amber-700"
                                        disabled={releasingCard}
                                        onClick={() => void handleReleaseCardAttempt()}
                                    >
                                        {releasingCard ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin text-lg mr-2">
                                                    progress_activity
                                                </span>
                                                {t("releaseCardButton")}
                                            </>
                                        ) : (
                                            t("releaseCardButton")
                                        )}
                                    </Button>
                                </div>
                            ) : null}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
                        {cardOk && (
                            <Button
                                variant="primary"
                                className="w-full sm:w-auto min-h-[44px]"
                                onClick={handlePayCard}
                                disabled={payActionsDisabled || payingCard || creatingTransfer}
                            >
                                {payingCard ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                                        {t("paying")}
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined mr-2">credit_card</span>
                                        {t("payButton")}
                                    </>
                                )}
                            </Button>
                        )}
                        {bankOk && (
                            <Button
                                variant="secondary"
                                className="w-full sm:w-auto min-h-[44px]"
                                onClick={handlePayTransfer}
                                disabled={payActionsDisabled || payingCard || creatingTransfer}
                            >
                                {creatingTransfer ? (
                                    <>
                                        <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                                        {t("transferCreating")}
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined mr-2">account_balance</span>
                                        {t("transferButton")}
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            {transferDetails && (() => {
                const proofPhone = (transferDetails.proofPhone ?? data.subscriptionProofPhone ?? "").trim();
                const waDigits = proofPhone.replace(/\D/g, "");
                return (
                <Card className="p-6 space-y-4 border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">receipt_long</span>
                        {t("transferTitle")}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t("transferPendingExplainer")}</p>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3 space-y-2">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{t("referenceProofTitle")}</p>
                        {proofPhone ? (
                            <>
                                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                                    {t("referenceProofBody", { phone: proofPhone })}
                                </p>
                                {waDigits.length >= 8 ? (
                                    <a
                                        href={`https://wa.me/${waDigits}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">chat</span>
                                        {t("proofWhatsappLink")}
                                    </a>
                                ) : null}
                            </>
                        ) : (
                            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">{t("referenceProofBodyNoPhone")}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{t("transferAmountHint")}</p>
                        <p className="text-slate-900 dark:text-white font-medium">
                            Q{transferDetails.amountGtq.toFixed(2)} {transferDetails.currency} — {t("periodLabel", { months: transferDetails.periodMonths })}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{t("transferInstructionsHeading")}</p>
                        <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">{transferDetails.instructions}</pre>
                    </div>
                </Card>
                );
            })()}
        </div>
    );
}

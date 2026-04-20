"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { downloadPlatformSubscriptionReceiptPdf } from "@/lib/download-platform-subscription-pdf";
import { toast } from "sonner";

const SUPER_COMPLEX_FILTER_KEY = "cm_platform_payments_super_complex";

type Row = {
    id: string;
    status: string;
    paymentMethod: string;
    amountCents: number;
    currency: string;
    paidAt: string | null;
    createdAt: string;
    complex: { id: string; name: string };
    invoice: { id: string; number: string } | null;
};

export function PlatformPaymentsAdminClient({
    mode,
    complexName,
}: {
    mode: "super" | "complex";
    complexName?: string;
}) {
    const t = useTranslations("PlatformPaymentsAdmin");
    const showComplexColumn = mode === "super";
    const canConfirmTransfers = mode === "super";
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(mode !== "super");
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [pdfInvoiceId, setPdfInvoiceId] = useState<string | null>(null);
    const [reconciling, setReconciling] = useState(false);
    /** Súper admin: "" = aún no eligió; "*" = todos los complejos; id = un complejo */
    const [superComplexFilter, setSuperComplexFilter] = useState("");
    const [complexOptions, setComplexOptions] = useState<{ id: string; name: string }[]>([]);

    useEffect(() => {
        if (mode !== "super") return;
        try {
            const stored = localStorage.getItem(SUPER_COMPLEX_FILTER_KEY);
            if (stored !== null) setSuperComplexFilter(stored);
        } catch {
            /* ignore */
        }
    }, [mode]);

    useEffect(() => {
        if (mode !== "super") return;
        let cancelled = false;
        void (async () => {
            try {
                const res = await fetch("/api/complexes");
                const data = await res.json();
                if (!cancelled && res.ok && Array.isArray(data)) {
                    setComplexOptions(data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
                }
            } catch {
                /* ignore */
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [mode]);

    const load = async (q: string) => {
        if (mode === "super" && superComplexFilter === "") {
            setRows([]);
            return;
        }
        const params = new URLSearchParams();
        if (q.trim()) params.set("q", q.trim());
        if (mode === "super" && superComplexFilter !== "" && superComplexFilter !== "*") {
            params.set("complexId", superComplexFilter);
        }
        const qs = params.toString();
        const url = qs ? `/api/platform-fee/admin/payments?${qs}` : "/api/platform-fee/admin/payments";
        const res = await fetch(url);
        const json = await res.json();
        if (res.ok && json?.data?.payments) {
            setRows(json.data.payments);
        } else if (!res.ok) {
            toast.error(json?.error?.message || t("loadError"));
        }
    };

    const persistSuperFilter = (value: string) => {
        setSuperComplexFilter(value);
        try {
            localStorage.setItem(SUPER_COMPLEX_FILTER_KEY, value);
        } catch {
            /* ignore */
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        if (mode === "super" && superComplexFilter === "") {
            setRows([]);
            setLoading(false);
            return;
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                await load(debouncedSearch);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [debouncedSearch, superComplexFilter, mode]);

    const statusLabel = (s: string) => {
        if (s === "PAID") return t("statusPaid");
        if (s === "CANCELLED") return t("statusCancelled");
        return t("statusPending");
    };

    const methodLabel = (m: string) => {
        if (m === "BANK_TRANSFER") return t("methodTransfer");
        return t("methodCard");
    };

    const handleConfirm = async (id: string) => {
        setConfirmingId(id);
        try {
            const res = await fetch(`/api/platform-fee/admin/payments/${id}/confirm`, { method: "POST" });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json?.error?.message || t("confirmError"));
                return;
            }
            toast.success(t("confirmSuccess"));
            await load(debouncedSearch);
        } catch {
            toast.error(t("confirmError"));
        } finally {
            setConfirmingId(null);
        }
    };

    const handleReconcileDuplicates = async () => {
        setReconciling(true);
        try {
            const res = await fetch("/api/platform-fee/admin/reconcile-duplicates", { method: "POST" });
            const json = await res.json();
            if (res.ok && json?.data) {
                toast.success(t("reconcileSuccess", { count: json.data.cancelled }));
                await load(debouncedSearch);
            } else {
                toast.error(json?.error?.message || t("reconcileError"));
            }
        } catch {
            toast.error(t("reconcileError"));
        } finally {
            setReconciling(false);
        }
    };

    const handleDownloadPdf = async (invoiceId: string) => {
        setPdfInvoiceId(invoiceId);
        try {
            const { error } = await downloadPlatformSubscriptionReceiptPdf(invoiceId);
            if (error) toast.error(error);
        } catch {
            toast.error(t("pdfError"));
        } finally {
            setPdfInvoiceId(null);
        }
    };

    const filteredEmpty = !loading && rows.length === 0;
    const superNeedsPick = mode === "super" && superComplexFilter === "";

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={mode === "super" ? t("subtitle") : t("subtitleComplex", { name: complexName ?? "" })}
            />

            {mode === "super" ? (
                <div className="space-y-3 max-w-3xl">
                    <p className="text-sm text-slate-600 dark:text-slate-400">{t("keysHint")}</p>
                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="min-h-[40px] text-sm"
                            disabled={reconciling}
                            onClick={() => void handleReconcileDuplicates()}
                        >
                            {reconciling ? (
                                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-xl">cleaning_services</span>
                            )}
                            <span className="ml-2">{t("reconcileButton")}</span>
                        </Button>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t("reconcileHint")}</p>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">{t("keysHintComplex")}</p>
            )}

            {mode === "super" ? (
                <div className="flex flex-col gap-2 max-w-md">
                    <label htmlFor="platform-payments-complex-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("filterComplexLabel")}
                    </label>
                    <select
                        id="platform-payments-complex-filter"
                        value={superComplexFilter}
                        onChange={(e) => persistSuperFilter(e.target.value)}
                        className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <option value="">{t("filterComplexPlaceholder")}</option>
                        <option value="*">{t("filterComplexAll")}</option>
                        {complexOptions.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {superNeedsPick ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t("filterComplexHint")}</p>
                    ) : null}
                </div>
            ) : null}

            <div className="relative flex-1 max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">
                    search
                </span>
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={mode === "super" ? t("searchPlaceholder") : t("searchPlaceholderComplex")}
                    className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark text-sm"
                    autoComplete="off"
                />
            </div>

            <Card className="overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center p-12">
                        <span className="material-symbols-outlined animate-spin text-4xl text-primary">
                            progress_activity
                        </span>
                    </div>
                ) : superNeedsPick ? (
                    <p className="p-8 text-center text-slate-500">{t("filterComplexPickTable")}</p>
                ) : filteredEmpty ? (
                    <p className="p-8 text-center text-slate-500">
                        {debouncedSearch.trim() ? t("emptySearch") : t("empty")}
                    </p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-slate-500">
                                <th className="p-4 font-medium">{t("created")}</th>
                                {showComplexColumn ? <th className="p-4 font-medium">{t("complex")}</th> : null}
                                <th className="p-4 font-medium">{t("amount")}</th>
                                <th className="p-4 font-medium">{t("method")}</th>
                                <th className="p-4 font-medium">{t("status")}</th>
                                <th className="p-4 font-medium w-[1%] whitespace-nowrap">{t("receiptPdf")}</th>
                                {canConfirmTransfers ? (
                                    <th className="p-4 font-medium w-[1%]">{t("actions")}</th>
                                ) : null}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr
                                    key={r.id}
                                    className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-900/40"
                                >
                                    <td className="p-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                        {new Date(r.createdAt).toLocaleString()}
                                    </td>
                                    {showComplexColumn ? (
                                        <td className="p-4 font-medium text-slate-900 dark:text-white">{r.complex.name}</td>
                                    ) : null}
                                    <td className="p-4">
                                        {(r.amountCents / 100).toFixed(2)} {r.currency}
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400">{methodLabel(r.paymentMethod)}</td>
                                    <td className="p-4">{statusLabel(r.status)}</td>
                                    <td className="p-4">
                                        {r.invoice && r.status === "PAID" ? (
                                            <Button
                                                variant="outline"
                                                className="min-h-[36px] text-xs whitespace-nowrap gap-1"
                                                disabled={pdfInvoiceId === r.invoice.id}
                                                onClick={() => handleDownloadPdf(r.invoice!.id)}
                                            >
                                                {pdfInvoiceId === r.invoice.id ? (
                                                    <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                                ) : (
                                                    <>
                                                        <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                                                        {t("downloadPdf")}
                                                    </>
                                                )}
                                            </Button>
                                        ) : (
                                            <span className="text-slate-400">—</span>
                                        )}
                                    </td>
                                    {canConfirmTransfers ? (
                                        <td className="p-4">
                                            {r.status === "PENDING" && r.paymentMethod === "BANK_TRANSFER" ? (
                                                <Button
                                                    variant="outline"
                                                    className="min-h-[36px] text-xs whitespace-nowrap"
                                                    disabled={confirmingId === r.id}
                                                    onClick={() => handleConfirm(r.id)}
                                                >
                                                    {confirmingId === r.id ? (
                                                        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                                    ) : (
                                                        t("confirmTransfer")
                                                    )}
                                                </Button>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                    ) : null}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
}

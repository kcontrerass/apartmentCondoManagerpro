"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

type ConfigPayload = {
    publicKey: string;
    bankTransferInstructions: string;
    subscriptionPriceGtq: string;
    subscriptionPeriodMonths: number | null;
    secretKeyConfigured: boolean;
    webhookSecretConfigured: boolean;
    keysActive: boolean;
    usingDatabaseKeys: boolean;
};

export function PlatformRecurrenteClient() {
    const t = useTranslations("PlatformRecurrente");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publicKey, setPublicKey] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [webhookSecret, setWebhookSecret] = useState("");
    const [bankTransferInstructions, setBankTransferInstructions] = useState("");
    const [subscriptionPriceGtq, setSubscriptionPriceGtq] = useState("");
    const [subscriptionPeriodMonths, setSubscriptionPeriodMonths] = useState("");
    const [meta, setMeta] = useState<Pick<
        ConfigPayload,
        "secretKeyConfigured" | "webhookSecretConfigured" | "keysActive" | "usingDatabaseKeys"
    > | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/platform/recurrente-config");
            const json = await res.json();
            if (!res.ok || !json?.data) {
                toast.error(json?.error?.message || t("loadError"));
                return;
            }
            const d = json.data as ConfigPayload;
            setPublicKey(d.publicKey ?? "");
            setBankTransferInstructions(d.bankTransferInstructions ?? "");
            setSubscriptionPriceGtq(d.subscriptionPriceGtq ?? "");
            setSubscriptionPeriodMonths(
                d.subscriptionPeriodMonths != null ? String(d.subscriptionPeriodMonths) : ""
            );
            setSecretKey("");
            setWebhookSecret("");
            setMeta({
                secretKeyConfigured: d.secretKeyConfigured,
                webhookSecretConfigured: d.webhookSecretConfigured,
                keysActive: d.keysActive,
                usingDatabaseKeys: d.usingDatabaseKeys,
            });
        } catch {
            toast.error(t("loadError"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial única
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const body: Record<string, string | number | null> = {};
            if (publicKey.trim()) body.publicKey = publicKey.trim();
            else body.publicKey = "";
            if (secretKey.trim()) body.secretKey = secretKey.trim();
            if (webhookSecret.trim()) body.webhookSecret = webhookSecret.trim();
            body.bankTransferInstructions = bankTransferInstructions;

            if (!subscriptionPriceGtq.trim()) {
                body.subscriptionPriceGtq = null;
            } else {
                const p = parseFloat(subscriptionPriceGtq.replace(",", "."));
                if (!Number.isFinite(p) || p <= 0) {
                    toast.error(t("subscriptionPriceInvalid"));
                    return;
                }
                body.subscriptionPriceGtq = p;
            }

            if (!subscriptionPeriodMonths.trim()) {
                body.subscriptionPeriodMonths = null;
            } else {
                const m = parseInt(subscriptionPeriodMonths, 10);
                if (!Number.isInteger(m) || m < 1 || m > 120) {
                    toast.error(t("subscriptionPeriodInvalid"));
                    return;
                }
                body.subscriptionPeriodMonths = m;
            }

            const res = await fetch("/api/platform/recurrente-config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (!res.ok) {
                toast.error(json?.error?.message || t("saveError"));
                return;
            }
            toast.success(t("saveSuccess"));
            setSecretKey("");
            setWebhookSecret("");
            await load();
        } catch {
            toast.error(t("saveError"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader title={t("title")} subtitle={t("subtitle")} />

            {meta && (
                <div className="flex flex-wrap gap-2 text-xs">
                    <span
                        className={`rounded-full px-2.5 py-1 font-medium ${meta.keysActive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200" : "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100"}`}
                    >
                        {meta.keysActive ? t("badgeActive") : t("badgeInactive")}
                    </span>
                    {meta.usingDatabaseKeys ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {t("badgeFromDb")}
                        </span>
                    ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {t("badgeFromEnv")}
                        </span>
                    )}
                </div>
            )}

            <Card className="p-6 space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t("intro")}</p>

                <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/20">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("pricingSectionTitle")}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                {t("subscriptionPriceLabel")}
                            </label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={subscriptionPriceGtq}
                                onChange={(e) => setSubscriptionPriceGtq(e.target.value)}
                                placeholder={t("subscriptionPricePlaceholder")}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">{t("subscriptionPriceHelp")}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                {t("subscriptionPeriodLabel")}
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={120}
                                value={subscriptionPeriodMonths}
                                onChange={(e) => setSubscriptionPeriodMonths(e.target.value)}
                                placeholder={t("subscriptionPeriodPlaceholder")}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark text-sm"
                            />
                            <p className="text-xs text-slate-500 mt-1">{t("subscriptionPeriodHelp")}</p>
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        {t("publicLabel")}
                    </label>
                    <input
                        type="text"
                        value={publicKey}
                        onChange={(e) => setPublicKey(e.target.value)}
                        placeholder="pk_..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        {t("secretLabel")}
                    </label>
                    <input
                        type="password"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder={meta?.secretKeyConfigured ? t("secretPlaceholder") : "sk_..."}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark text-sm"
                    />
                    {meta?.secretKeyConfigured && (
                        <p className="text-xs text-slate-500 mt-1">{t("secretHelp")}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        {t("webhookLabel")}
                    </label>
                    <input
                        type="password"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        placeholder={meta?.webhookSecretConfigured ? t("secretPlaceholder") : t("webhookPlaceholder")}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">{t("webhookHelp")}</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        {t("bankInstructionsLabel")}
                    </label>
                    <textarea
                        value={bankTransferInstructions}
                        onChange={(e) => setBankTransferInstructions(e.target.value)}
                        rows={6}
                        placeholder={t("bankInstructionsPlaceholder")}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark text-sm resize-y min-h-[120px]"
                    />
                    <p className="text-xs text-slate-500 mt-1">{t("bankInstructionsHelp")}</p>
                </div>

                <Button
                    variant="primary"
                    className="min-h-[44px]"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <>
                            <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                            {t("saving")}
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined mr-2">save</span>
                            {t("save")}
                        </>
                    )}
                </Button>
            </Card>
        </div>
    );
}

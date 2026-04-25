"use client";

import { useTranslations } from "next-intl";
import { useRecurrenteFeeConfig } from "@/hooks/useRecurrenteFeeConfig";
import { computeRecurrenteCardAmountsWithConfig } from "@/lib/recurrente-fee-math";
import { formatPrice } from "@/lib/utils";

type Props = {
    baseGtq: number;
    /** Facturas / reservas del complejo */
    complexId?: string | null;
    /** Suscripción plataforma (claves distintas) */
    platform?: boolean;
};

/**
 * Desglose de monto con tarjeta (comisión aprox.); obtiene PCT/fijo vía API interna o ajustes del sistema.
 */
export function RecurrenteCardFeeBreakdown({ baseGtq, complexId, platform }: Props) {
    const t = useTranslations("Payments.recurrenteCardFee");
    const config = useRecurrenteFeeConfig(complexId, platform);

    if (baseGtq <= 0) return null;
    if (!config) return null;

    const split = computeRecurrenteCardAmountsWithConfig(Math.round(baseGtq * 100), config);
    if (split.surchargeCents <= 0) return null;

    return (
        <div className="rounded-lg border border-amber-200/80 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/20 px-3 py-2.5 text-sm space-y-2">
            <p className="text-amber-900 dark:text-amber-100/90 leading-relaxed">
                {t("notice", { percent: config.pct, fixed: config.fixedGtq })}
            </p>
            <div className="space-y-1 text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                <div className="flex justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400">{t("subtotal")}</span>
                    <span className="font-medium tabular-nums">
                        {formatPrice(split.baseCents / 100)}
                    </span>
                </div>
                <div className="flex justify-between gap-2">
                    <span className="text-slate-600 dark:text-slate-400">
                        {t("surchargeLine", { percent: config.pct, fixed: config.fixedGtq })}
                    </span>
                    <span className="font-medium tabular-nums">
                        {formatPrice(split.surchargeCents / 100)}
                    </span>
                </div>
                <p className="pt-1 font-semibold text-slate-900 dark:text-white border-t border-amber-200/60 dark:border-amber-800/40">
                    {t("totalWithCard", { total: formatPrice(split.totalCents / 100) })}
                </p>
            </div>
        </div>
    );
}

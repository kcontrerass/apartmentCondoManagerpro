"use client";

import { useTranslations } from "next-intl";
import type { RecurrenteFeeConfig } from "@/lib/recurrente-fee-types";
import { computeRecurrenteCardAmountsWithConfig } from "@/lib/recurrente-fee-math";
import { formatPrice } from "@/lib/utils";

type Props = {
    baseGtq: number;
    config: RecurrenteFeeConfig | null;
    className?: string;
};

/** Una o dos líneas: %/fijos + total aprox. con tarjeta (tabla de facturas, dashboard). */
export function RecurrenteCardFeeInline({ baseGtq, config, className = "" }: Props) {
    const t = useTranslations("Payments.recurrenteCardFee");
    if (baseGtq <= 0 || !config) return null;
    const split = computeRecurrenteCardAmountsWithConfig(
        Math.round(baseGtq * 100),
        config
    );
    if (split.surchargeCents <= 0) return null;

    return (
        <div
            className={`text-[10px] leading-tight text-amber-800/90 dark:text-amber-200/80 mt-0.5 max-w-[16rem] ${className}`.trim()}
        >
            <p>
                {t("tableInline", { percent: config.pct, fixed: config.fixedGtq })}
            </p>
            <p className="text-slate-600 dark:text-slate-400 font-medium tabular-nums">
                {t("tableInlineTotal", { total: formatPrice(split.totalCents / 100) })}
            </p>
        </div>
    );
}

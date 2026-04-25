/**
 * Fórmula alineada a la calculadora de Recurrente (link de pago / tarjeta):
 *   comisión = redondeo(monto_cobrado × pct/100, 2 dec. en GTQ) + fixed_gtq
 */

import type { RecurrenteFeeConfig } from "@/lib/recurrente-fee-types";

function feeCentsFromGrossCents(grossCents: number, c: RecurrenteFeeConfig): number {
    if (grossCents <= 0) return 0;
    const grossGtq = grossCents / 100;
    const variableGtq = Math.round((grossGtq * c.pct) / 100 * 100) / 100;
    const feeGtq = variableGtq + c.fixedGtq;
    return Math.round(feeGtq * 100);
}

export function recurrenteNetCentsFromGrossCents(grossCents: number, c: RecurrenteFeeConfig): number {
    return Math.max(0, grossCents - feeCentsFromGrossCents(grossCents, c));
}

export function grossCentsForTargetNetCents(targetNetCents: number, c: RecurrenteFeeConfig): number {
    const t = Math.max(0, Math.round(targetNetCents));
    if (!c.passThrough || t === 0) return t;
    for (let g = t; g <= t * 5 + 1_000_000; g++) {
        if (recurrenteNetCentsFromGrossCents(g, c) === t) return g;
    }
    for (let g = t; g <= t * 5 + 1_000_000; g++) {
        if (recurrenteNetCentsFromGrossCents(g, c) >= t) return g;
    }
    return t;
}

export function computeRecurrenteCardAmountsWithConfig(
    baseCents: number,
    c: RecurrenteFeeConfig
): { baseCents: number; surchargeCents: number; totalCents: number } {
    const base = Math.max(0, Math.round(baseCents));
    if (!c.passThrough || (c.pct <= 0 && c.fixedGtq <= 0)) {
        return { baseCents: base, surchargeCents: 0, totalCents: base };
    }
    const total = grossCentsForTargetNetCents(base, c);
    return { baseCents: base, surchargeCents: Math.max(0, total - base), totalCents: total };
}

export function hasRecurrenteCardFeeForConfig(c: RecurrenteFeeConfig): boolean {
    if (!c.passThrough) return false;
    if (c.pct <= 0 && c.fixedGtq <= 0) return false;
    const s = computeRecurrenteCardAmountsWithConfig(100, c);
    return s.surchargeCents > 0;
}

export function buildRecurrenteCardCheckoutLineItemsWithConfig(
    baseItem: { name: string; currency: string },
    baseCents: number,
    c: RecurrenteFeeConfig
) {
    const { totalCents, surchargeCents, baseCents: base } = computeRecurrenteCardAmountsWithConfig(
        baseCents,
        c
    );
    if (surchargeCents <= 0) {
        return [
            {
                name: baseItem.name,
                currency: baseItem.currency,
                amount_in_cents: base,
                quantity: 1 as const,
            },
        ];
    }
    return [
        {
            name: `${baseItem.name} (total a cobrar con tarjeta; ajuste comisión Recurrente)`,
            currency: baseItem.currency,
            amount_in_cents: totalCents,
            quantity: 1 as const,
        },
    ];
}

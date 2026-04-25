import type { RecurrenteFeeConfig } from "@/lib/recurrente-fee-types";

function parseNum(raw: string | undefined, fallback: string): number {
    const s = (raw ?? fallback).trim().replace(",", ".");
    const n = parseFloat(s);
    if (!Number.isFinite(n) || n < 0) return 0;
    return n;
}

/** Valores de entorno (y client-side NEXT_PUBLIC_) cuando no hay URL ni API con tarifas. */
export function getDefaultRecurrenteFeeConfigFromEnv(): RecurrenteFeeConfig {
    if (process.env.RECURRENTE_FEE_PASSTHROUGH === "false") {
        return { pct: 0, fixedGtq: 0, passThrough: false, source: "default" };
    }
    const pct = parseNum(
        process.env.NEXT_PUBLIC_RECURRENTE_FEE_PCT ?? process.env.RECURRENTE_FEE_PCT,
        "0"
    );
    const fixedGtq = parseNum(
        process.env.NEXT_PUBLIC_RECURRENTE_FEE_FIXED_GTQ ?? process.env.RECURRENTE_FEE_FIXED_GTQ,
        "0"
    );
    if (pct > 0 || fixedGtq > 0) {
        return { pct, fixedGtq, passThrough: true, source: "env" };
    }
    // Link de pago comercial — típico; sobreescribible vía .env
    return { pct: 4.5, fixedGtq: 2, passThrough: true, source: "default" };
}

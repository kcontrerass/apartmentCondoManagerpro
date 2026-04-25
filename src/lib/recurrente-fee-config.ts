import type { RecurrenteKeys } from "@/lib/recurrente";
import { getDefaultRecurrenteFeeConfigFromEnv } from "@/lib/recurrente-fee-config-env";
import type { RecurrenteFeeConfig } from "@/lib/recurrente-fee-types";

export type { RecurrenteFeeConfig } from "@/lib/recurrente-fee-types";

const BASE = "https://app.recurrente.com/api";

type JsonRecord = Record<string, unknown>;

function parseNumLoose(x: unknown): number | null {
    if (typeof x === "number" && Number.isFinite(x)) return x;
    if (typeof x === "string") {
        const n = parseFloat(x.trim().replace(",", "."));
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

/** Acepta { pct, fixedGtq } o { percentage, fixed_gtq } etc. */
export function parseFeeRatesJsonPayload(data: unknown): { pct: number; fixedGtq: number } | null {
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const o = data as JsonRecord;
    const pct = parseNumLoose(
        o.pct ?? o.percent ?? o.percentage ?? o.fee_percent ?? o.card_fee_percent
    );
    const fixedGtq = parseNumLoose(
        o.fixedGtq ?? o.fixed_gtq ?? o.fixed ?? o.fixed_quetzal ?? o.fixed_q
    );
    if (pct == null && fixedGtq == null) return null;
    return { pct: pct ?? 0, fixedGtq: fixedGtq ?? 0 };
}

/**
 * Si Recurrente añade campos a /api/account, mapearlos aquí. Hoy (2026) el payload no trae comisiones.
 * @see script de prueba: GET /api/account → id, name, status, account_type, created_at, creator_*
 */
export function parseRecurrenteAccountForFeeHints(account: unknown): { pct: number; fixedGtq: number } | null {
    if (!account || typeof account !== "object" || Array.isArray(account)) return null;
    const o = account as JsonRecord;
    // Posibles nombres futuros (ajustar cuando existan en producto)
    if (o.link_payment_fee) {
        const p = parseFeeRatesJsonPayload(o.link_payment_fee);
        if (p) return p;
    }
    if (o.fees && typeof o.fees === "object" && !Array.isArray(o.fees)) {
        const f = o.fees as JsonRecord;
        const card = f.card_one_time ?? f.link_de_pago ?? f.one_time;
        if (card && typeof card === "object") {
            const p = parseFeeRatesJsonPayload(card);
            if (p) return p;
        }
    }
    return null;
}

async function fetchJsonFromFeeRatesUrl(url: string): Promise<unknown> {
    const res = await fetch(url, {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json().catch(() => null)) as unknown;
}

export async function fetchRecurrenteAccountWithKeys(
    keys: RecurrenteKeys
): Promise<unknown | null> {
    const res = await fetch(`${BASE}/account`, {
        headers: {
            "X-PUBLIC-KEY": keys.publicKey,
            "X-SECRET-KEY": keys.secretKey,
        },
        next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json().catch(() => null)) as unknown;
}

const feeUrlCache = new Map<string, { at: number; config: RecurrenteFeeConfig | null }>();
const accountCache = new Map<string, { at: number; config: { pct: number; fixedGtq: number } | null }>();
const TTL_MS = 3_600_000;

/**
 * Resuelve PCT y Q fijos para la calculadora, en este orden:
 * 1) `RECURRENTE_FEE_RATES_URL` — JSON tuyo o CDN (se actualiza sin redeploy)
 * 2) Campos en `GET /api/account` (cuando Recurrente los exponga)
 * 3) Variables de entorno
 * 4) Default 4,5 + 2 (link de pago comercial, según página de precios; ajusta si aplica a tu cuenta)
 */
export async function resolveRecurrenteFeeConfig(keys: RecurrenteKeys | null): Promise<RecurrenteFeeConfig> {
    const passThrough = process.env.RECURRENTE_FEE_PASSTHROUGH !== "false";
    if (!passThrough) {
        return { pct: 0, fixedGtq: 0, passThrough: false, source: "default" };
    }

    const url = process.env.RECURRENTE_FEE_RATES_URL?.trim();
    if (url) {
        const now = Date.now();
        const hit = feeUrlCache.get(url);
        if (hit && now - hit.at < TTL_MS && hit.config) {
            return hit.config;
        }
        const json = await fetchJsonFromFeeRatesUrl(url);
        const parsed = parseFeeRatesJsonPayload(json);
        if (parsed && (parsed.pct > 0 || parsed.fixedGtq > 0)) {
            const config: RecurrenteFeeConfig = {
                ...parsed,
                passThrough: true,
                source: "fee_rates_url",
            };
            feeUrlCache.set(url, { at: now, config });
            return config;
        }
        feeUrlCache.set(url, { at: now, config: null });
    }

    if (keys?.publicKey && keys.secretKey) {
        const cacheKey = keys.publicKey.slice(0, 32);
        const now = Date.now();
        const hit = accountCache.get(cacheKey);
        const cacheValid = hit && now - hit.at < TTL_MS;
        if (cacheValid && hit!.config) {
            return { ...hit!.config, passThrough: true, source: "api_account" };
        }
        if (!cacheValid) {
            const acc = await fetchRecurrenteAccountWithKeys(keys);
            const fromApi = acc ? parseRecurrenteAccountForFeeHints(acc) : null;
            accountCache.set(cacheKey, { at: now, config: fromApi });
            if (fromApi && (fromApi.pct > 0 || fromApi.fixedGtq > 0)) {
                return { ...fromApi, passThrough: true, source: "api_account" };
            }
        }
    }

    return getDefaultRecurrenteFeeConfigFromEnv();
}

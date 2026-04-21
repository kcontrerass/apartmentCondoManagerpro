const PAID_STATUS_VALUES = new Set([
    "paid",
    "completed",
    "succeeded",
    "success",
    "successful",
    "complete",
    "paid_out",
    "captured",
    "approved",
]);

/** Estados terminales sin cobro (checkout cerrado / rechazado / expirado). */
const ABANDONED_STATUS_VALUES = new Set([
    "cancelled",
    "canceled",
    "expired",
    "failed",
    "failure",
    "void",
    "abandoned",
    "declined",
    "rejected",
    "payment_failed",
    "cancelled_payment",
    "canceled_payment",
]);

function shallowAbandonedSignals(obj: Record<string, unknown>): boolean {
    const nested = obj.checkout;
    const data = obj.data;
    const candidates: unknown[] = [
        obj.status,
        obj.payment_status,
        obj.paymentStatus,
        obj.state,
        obj.checkout_status,
        obj.paymentState,
        typeof nested === "object" && nested !== null
            ? (nested as Record<string, unknown>).status
            : undefined,
        typeof nested === "object" && nested !== null
            ? (nested as Record<string, unknown>).payment_status
            : undefined,
        typeof data === "object" && data !== null
            ? (data as Record<string, unknown>).status
            : undefined,
        typeof data === "object" && data !== null
            ? (data as Record<string, unknown>).payment_status
            : undefined,
    ];
    for (const x of candidates) {
        if (x == null) continue;
        const s = String(x).toLowerCase().trim();
        if (ABANDONED_STATUS_VALUES.has(s)) return true;
    }
    return false;
}

function shallowPaidSignals(obj: Record<string, unknown>): boolean {
    const nested = obj.checkout;
    const data = obj.data;
    const candidates: unknown[] = [
        obj.status,
        obj.payment_status,
        obj.paymentStatus,
        obj.state,
        obj.checkout_status,
        obj.paymentState,
        typeof nested === "object" && nested !== null
            ? (nested as Record<string, unknown>).status
            : undefined,
        typeof nested === "object" && nested !== null
            ? (nested as Record<string, unknown>).payment_status
            : undefined,
        typeof data === "object" && data !== null
            ? (data as Record<string, unknown>).status
            : undefined,
        typeof data === "object" && data !== null
            ? (data as Record<string, unknown>).payment_status
            : undefined,
    ];
    for (const x of candidates) {
        if (x == null) continue;
        const s = String(x).toLowerCase().trim();
        if (PAID_STATUS_VALUES.has(s)) return true;
    }
    return false;
}

/** Profundidad limitada: la API de Recurrente cambia forma según versión. */
function deepPaidWalk(obj: unknown, depth: number, seen: WeakSet<object>): boolean {
    if (depth > 8 || obj == null) return false;
    if (typeof obj !== "object") return false;
    if (seen.has(obj as object)) return false;
    seen.add(obj as object);

    if (Array.isArray(obj)) {
        return obj.some((item) => deepPaidWalk(item, depth + 1, seen));
    }

    const rec = obj as Record<string, unknown>;
    if (shallowPaidSignals(rec)) return true;

    for (const [k, v] of Object.entries(rec)) {
        const kl = k.toLowerCase();
        if (
            (kl.includes("status") || kl === "state" || kl.includes("payment_state")) &&
            typeof v === "string"
        ) {
            const s = v.toLowerCase().trim();
            if (PAID_STATUS_VALUES.has(s)) return true;
        }
        if (typeof v === "object" && v !== null && deepPaidWalk(v, depth + 1, seen)) {
            return true;
        }
    }
    return false;
}

function deepAbandonedWalk(obj: unknown, depth: number, seen: WeakSet<object>): boolean {
    if (depth > 8 || obj == null) return false;
    if (typeof obj !== "object") return false;
    if (seen.has(obj as object)) return false;
    seen.add(obj as object);

    if (Array.isArray(obj)) {
        return obj.some((item) => deepAbandonedWalk(item, depth + 1, seen));
    }

    const rec = obj as Record<string, unknown>;
    if (shallowAbandonedSignals(rec)) return true;

    for (const [k, v] of Object.entries(rec)) {
        const kl = k.toLowerCase();
        if (
            (kl.includes("status") || kl === "state" || kl.includes("payment_state")) &&
            typeof v === "string"
        ) {
            const s = v.toLowerCase().trim();
            if (ABANDONED_STATUS_VALUES.has(s)) return true;
        }
        if (typeof v === "object" && v !== null && deepAbandonedWalk(v, depth + 1, seen)) {
            return true;
        }
    }
    return false;
}

/**
 * Normalizes Recurrente checkout retrieve responses — shape varies by API version.
 */
export function isRecurrenteCheckoutPaid(checkout: unknown): boolean {
    if (!checkout || typeof checkout !== "object") return false;
    const c = checkout as Record<string, unknown>;
    if (shallowPaidSignals(c)) return true;
    return deepPaidWalk(checkout, 0, new WeakSet());
}

/**
 * Checkout cerrado sin cobro (p. ej. usuario salió o la sesión expiró en Recurrente).
 * No usar como única señal si el usuario puede seguir en el flujo de pago (comparar con antigüedad del intento).
 */
export function isRecurrenteCheckoutAbandoned(checkout: unknown): boolean {
    if (!checkout || typeof checkout !== "object") return false;
    const c = checkout as Record<string, unknown>;
    if (isRecurrenteCheckoutPaid(checkout)) return false;
    if (shallowAbandonedSignals(c)) return true;
    return deepAbandonedWalk(checkout, 0, new WeakSet());
}

export function getRecurrenteCheckoutMetadata(checkout: unknown): Record<string, unknown> {
    if (!checkout || typeof checkout !== "object") return {};
    const c = checkout as Record<string, unknown>;
    const direct = c.metadata;
    if (direct && typeof direct === "object" && !Array.isArray(direct)) {
        return direct as Record<string, unknown>;
    }
    const nested = c.checkout;
    if (typeof nested === "object" && nested !== null) {
        const m = (nested as Record<string, unknown>).metadata;
        if (m && typeof m === "object" && !Array.isArray(m)) {
            return m as Record<string, unknown>;
        }
    }
    const data = c.data;
    if (typeof data === "object" && data !== null) {
        const m = (data as Record<string, unknown>).metadata;
        if (m && typeof m === "object" && !Array.isArray(m)) {
            return m as Record<string, unknown>;
        }
        const obj = (data as Record<string, unknown>).object;
        if (typeof obj === "object" && obj !== null) {
            const m2 = (obj as Record<string, unknown>).metadata;
            if (m2 && typeof m2 === "object" && !Array.isArray(m2)) {
                return m2 as Record<string, unknown>;
            }
        }
    }
    return {};
}

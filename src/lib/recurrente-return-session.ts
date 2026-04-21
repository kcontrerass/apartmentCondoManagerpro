/**
 * Tras el pago, Recurrente redirige con el id del checkout. El placeholder `{CHECKOUT_SESSION_ID}`
 * a veces llega sin sustituir; Recurrente puede añadir otro `checkout_id=ch_…`. Si hay varios
 * valores para la misma clave (query duplicada), Next.js puede devolver `string[]` — hay que
 * elegir el primero válido (p. ej. `ch_…`), no el último placeholder.
 */
const PLACEHOLDER_LOWER = "{checkout_session_id}";
const PLACEHOLDER_UPPER = "{CHECKOUT_SESSION_ID}";

export type RecurrenteReturnSearchParam = string | string[] | undefined;

export type RecurrenteReturnSearchParams = {
    checkout_id?: RecurrenteReturnSearchParam;
    session_id?: RecurrenteReturnSearchParam;
    checkout_session_id?: RecurrenteReturnSearchParam;
    id?: RecurrenteReturnSearchParam;
    ch_id?: RecurrenteReturnSearchParam;
    reference_id?: RecurrenteReturnSearchParam;
};

function expand(param: RecurrenteReturnSearchParam): string[] {
    if (param == null) return [];
    return Array.isArray(param) ? param : [param];
}

/** Orden: primero ids que Recurrente suele rellenar bien; luego session_id (a veces solo placeholder). */
function orderedRawValues(sp: RecurrenteReturnSearchParams): string[] {
    return [
        ...expand(sp.checkout_id),
        ...expand(sp.ch_id),
        ...expand(sp.reference_id),
        ...expand(sp.id),
        ...expand(sp.checkout_session_id),
        ...expand(sp.session_id),
    ];
}

function normalizeSingle(raw: string): string | undefined {
    const t = raw.trim();
    let decoded = t;
    try {
        decoded = decodeURIComponent(t.replace(/\+/g, " "));
    } catch {
        decoded = t;
    }
    if (decoded === PLACEHOLDER_LOWER || decoded === PLACEHOLDER_UPPER) return undefined;
    if (/^\{[a-zA-Z0-9_]+\}$/.test(decoded)) return undefined;
    return decoded.length > 0 ? decoded : undefined;
}

export function resolveRecurrenteCheckoutIdFromSearchParams(
    sp: RecurrenteReturnSearchParams
): string | undefined {
    const raws = orderedRawValues(sp);

    for (const raw of raws) {
        const n = normalizeSingle(raw);
        if (n && /^ch_[a-z0-9]+$/i.test(n)) {
            return n;
        }
    }
    for (const raw of raws) {
        const n = normalizeSingle(raw);
        if (n) {
            return n;
        }
    }
    return undefined;
}

/** Límites del mes calendario en UTC (regla de un pago de plataforma por mes). */
export function getUtcMonthBounds(reference: Date = new Date()): { start: Date; end: Date } {
    const y = reference.getUTCFullYear();
    const m = reference.getUTCMonth();
    const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
    return { start, end };
}

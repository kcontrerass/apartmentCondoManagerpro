/**
 * Correo mostrado en /support (mailto). Prioridad: NEXT_PUBLIC_SUPPORT_EMAIL; si no,
 * se intenta extraer la dirección de EMAIL_FROM (solo servidor).
 */
export function getPublicSupportEmail(): string | undefined {
    const pub = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
    if (pub) return pub;

    const from = process.env.EMAIL_FROM?.trim();
    if (!from) return undefined;

    const quoted = from.match(/^"([^"]*)"\s*<([^>]+)>\s*$/);
    if (quoted?.[2]?.includes('@')) return quoted[2].trim();

    const bracket = from.match(/<([^>\s]+@[^>\s]+)>/);
    if (bracket?.[1]) return bracket[1].trim();

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) return from;

    return undefined;
}

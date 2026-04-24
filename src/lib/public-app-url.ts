/**
 * URL pública de la app (enlaces en correos, etc.). En producción: NEXTAUTH_URL o AUTH_URL.
 */
export function getPublicAppUrl(): string {
    const raw = process.env.NEXTAUTH_URL || process.env.AUTH_URL;
    if (raw) return raw.replace(/\/$/, '');
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
    return 'http://localhost:3000';
}

import { prisma } from '@/lib/db';

function isSimpleEmail(s: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function fromEmailFromEnv(): string | undefined {
    const from = process.env.EMAIL_FROM?.trim();
    if (!from) return undefined;

    const quoted = from.match(/^"([^"]*)"\s*<([^>]+)>\s*$/);
    if (quoted?.[2] && isSimpleEmail(quoted[2].trim())) return quoted[2].trim();

    const bracket = from.match(/<([^>\s]+@[^>\s]+)>/);
    if (bracket?.[1] && isSimpleEmail(bracket[1].trim())) return bracket[1].trim();

    if (isSimpleEmail(from)) return from;

    return undefined;
}

/**
 * Correo del mailto en /support. Orden: BD (súper admin), NEXT_PUBLIC_SUPPORT_EMAIL, EMAIL_FROM.
 */
export async function getPublicSupportEmail(): Promise<string | undefined> {
    try {
        const row = await prisma.platformRecurrenteSettings.findUnique({
            where: { id: 'default' },
            select: { supportEmail: true },
        });
        const fromDb = row?.supportEmail?.trim();
        if (fromDb && isSimpleEmail(fromDb)) return fromDb;
    } catch {
        // Columna aún no migrada u otro error de lectura
    }

    const pub = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();
    if (pub && isSimpleEmail(pub)) return pub;

    return fromEmailFromEnv();
}

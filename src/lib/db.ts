import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
};

/**
 * Limita conexiones por instancia de PrismaClient (pool interno). El valor por defecto de Prisma
 * en MySQL es alto; con Turbopack / varias rutas en paralelo o varios `next dev` viejos se agota
 * el servidor (HY000 1040). Opcional: `PRISMA_CONNECTION_LIMIT`.
 */
function getDatabaseUrlWithPoolLimit(): string | undefined {
    const raw = process.env.DATABASE_URL?.trim();
    if (!raw) return undefined;
    if (/[?&]connection_limit=/i.test(raw)) {
        return raw;
    }
    const limit =
        process.env.PRISMA_CONNECTION_LIMIT?.trim() ||
        (process.env.NODE_ENV === "production" ? "5" : "1");
    const sep = raw.includes("?") ? "&" : "?";
    return `${raw}${sep}connection_limit=${encodeURIComponent(limit)}`;
}

function createPrisma() {
    const url = getDatabaseUrlWithPoolLimit();
    return new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error", "warn"],
        ...(url ? { datasources: { db: { url } } } : {}),
    });
}

/**
 * Un único PrismaClient por proceso Node (`globalThis`).
 *
 * No recreamos el cliente al cambiar `.prisma/client` en caliente: hacerlo disparaba otro pool
 * mientras el anterior aún cerraba conexiones → picos de "Too many connections". Tras
 * `prisma generate`, reinicia `next dev`.
 */
function getPrisma(): PrismaClient {
    return (globalForPrisma.prisma ??= createPrisma());
}

/** Proxy: importación estable; el cliente real es el singleton en globalThis. */
export const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop: string | symbol) {
        const client = getPrisma();
        const value = (client as unknown as Record<string | symbol, unknown>)[prop];
        return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
    },
}) as PrismaClient;

if (process.env.NODE_ENV !== "production") {
    const g = globalThis as unknown as { __prismaBeforeExitHook?: boolean };
    if (!g.__prismaBeforeExitHook) {
        g.__prismaBeforeExitHook = true;
        process.once("beforeExit", () => {
            void globalForPrisma.prisma?.$disconnect();
        });
    }
}

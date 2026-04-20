import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const generatedClientMarker = path.join(process.cwd(), "node_modules", ".prisma", "client", "index.js");

function createPrisma() {
    return new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query"] : ["error", "warn"],
    });
}

/**
 * En desarrollo, Turbopack puede mantener vivo un `PrismaClient` creado **antes** de `prisma generate`.
 * Recreamos el cliente cuando cambia el archivo generado (mtime), sin tener que reiniciar el servidor.
 */
let devPrisma: PrismaClient | undefined;
let devPrismaGeneratedAt = 0;

function getDevPrisma(): PrismaClient {
    try {
        const mtime = fs.statSync(generatedClientMarker).mtimeMs;
        if (!devPrisma || mtime > devPrismaGeneratedAt) {
            if (devPrisma) {
                void devPrisma.$disconnect().catch(() => {});
            }
            devPrisma = createPrisma();
            devPrismaGeneratedAt = mtime;
        }
        return devPrisma;
    } catch {
        devPrisma = devPrisma ?? createPrisma();
        return devPrisma;
    }
}

export const prisma: PrismaClient =
    process.env.NODE_ENV === "production"
        ? (globalForPrisma.prisma ??= createPrisma())
        : (new Proxy({} as PrismaClient, {
              get(_target, prop: string | symbol) {
                  const client = getDevPrisma();
                  const value = (client as unknown as Record<string | symbol, unknown>)[prop];
                  return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(client) : value;
              },
          }) as PrismaClient);

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

function isMissingPlatformPaidUntilColumn(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2022") {
        return false;
    }
    const msg = typeof error.message === "string" ? error.message : "";
    const meta = error.meta as { column?: string } | undefined;
    const col = meta?.column ?? "";
    return msg.includes("platform_paid_until") || col.includes("platform_paid_until");
}

/**
 * Complejo del administrador para cuota de plataforma.
 * Si la BD aún no tiene la columna `platform_paid_until`, devuelve `platformPaidUntil: null`.
 */
export async function findAdminComplexForPlatformFee(adminUserId: string): Promise<{
    id: string;
    name: string;
    platformPaidUntil: Date | null;
} | null> {
    try {
        return await prisma.complex.findFirst({
            where: { adminId: adminUserId },
            select: { id: true, name: true, platformPaidUntil: true },
        });
    } catch (e) {
        if (!isMissingPlatformPaidUntilColumn(e)) throw e;
        const row = await prisma.complex.findFirst({
            where: { adminId: adminUserId },
            select: { id: true, name: true },
        });
        return row ? { ...row, platformPaidUntil: null } : null;
    }
}

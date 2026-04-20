import { prisma } from "@/lib/db";
import { PlatformFeeStatus } from "@prisma/client";
import { getUtcMonthBounds } from "@/lib/platform-fee-utc-bounds";

/**
 * Un complejo no puede tener varios cobros válidos de suscripción a la plataforma en el mismo mes UTC.
 *
 * - Si ya hay un PAID con paidAt en ese mes → se cancelan **todos** los PENDING del complejo
 *   (intentos de tarjeta abandonados, transferencias duplicadas, etc.).
 * - Si no hay PAID en ese mes pero hay varios PENDING creados en ese mes → se deja el más reciente
 *   y el resto se cancela.
 */
export async function reconcilePlatformFeePaymentsForUtcMonth(
    complexId: string,
    reference: Date = new Date()
): Promise<number> {
    const { start, end } = getUtcMonthBounds(reference);
    let n = 0;

    const paidInMonth = await prisma.platformFeePayment.findFirst({
        where: {
            complexId,
            status: PlatformFeeStatus.PAID,
            paidAt: { gte: start, lte: end },
        },
        select: { id: true },
    });

    if (paidInMonth) {
        const r = await prisma.platformFeePayment.updateMany({
            where: {
                complexId,
                status: PlatformFeeStatus.PENDING,
            },
            data: { status: PlatformFeeStatus.CANCELLED },
        });
        return r.count;
    }

    const pendingInMonth = await prisma.platformFeePayment.findMany({
        where: {
            complexId,
            status: PlatformFeeStatus.PENDING,
            createdAt: { gte: start, lte: end },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true },
    });

    if (pendingInMonth.length <= 1) return 0;

    const toCancel = pendingInMonth.slice(1).map((p) => p.id);
    await prisma.platformFeePayment.updateMany({
        where: { id: { in: toCancel } },
        data: { status: PlatformFeeStatus.CANCELLED },
    });

    return toCancel.length;
}

/** Recorre complejos y los últimos N meses UTC para corregir datos históricos. */
export async function reconcileAllPlatformFeePaymentsRecentMonths(monthsBack = 36): Promise<{
    cancelled: number;
}> {
    let cancelled = 0;
    const complexes = await prisma.complex.findMany({ select: { id: true } });
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();

    for (const c of complexes) {
        for (let i = 0; i < monthsBack; i++) {
            const ref = new Date(Date.UTC(y, m - i, 1));
            cancelled += await reconcilePlatformFeePaymentsForUtcMonth(c.id, ref);
        }
    }

    return { cancelled };
}

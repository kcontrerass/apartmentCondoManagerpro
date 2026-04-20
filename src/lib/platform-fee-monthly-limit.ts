import { prisma } from "@/lib/db";
import { PlatformFeePaymentMethod, PlatformFeeStatus } from "@prisma/client";
import { reconcilePlatformFeePaymentsForUtcMonth } from "@/lib/platform-fee-dedupe";
import { syncPlatformCardPaymentFromRecurrenteForComplex } from "@/lib/platform-fee-recurrente-sync";
import { getUtcMonthBounds } from "@/lib/platform-fee-utc-bounds";

export type PlatformFeePaymentBlockReason = "PENDING" | "PAID_THIS_MONTH";

export { getUtcMonthBounds } from "@/lib/platform-fee-utc-bounds";

/**
 * Un complejo puede iniciar como máximo un cobro de suscripción a la plataforma por mes calendario (UTC)
 * y no puede abrir otro si ya hay uno pendiente.
 */
export async function getPlatformFeePaymentEligibility(
    complexId: string,
    now: Date = new Date()
): Promise<
    | { canPay: true }
    | {
          canPay: false;
          reason: PlatformFeePaymentBlockReason;
          pendingPaymentMethod?: PlatformFeePaymentMethod;
      }
> {
    await syncPlatformCardPaymentFromRecurrenteForComplex(complexId);
    await reconcilePlatformFeePaymentsForUtcMonth(complexId, now);

    const pending = await prisma.platformFeePayment.findFirst({
        where: { complexId, status: PlatformFeeStatus.PENDING },
        select: { id: true, paymentMethod: true },
    });
    if (pending) {
        return {
            canPay: false,
            reason: "PENDING",
            pendingPaymentMethod: pending.paymentMethod,
        };
    }

    const { start, end } = getUtcMonthBounds(now);
    const paidThisMonth = await prisma.platformFeePayment.findFirst({
        where: {
            complexId,
            status: PlatformFeeStatus.PAID,
            paidAt: { gte: start, lte: end },
        },
        select: { id: true },
    });
    if (paidThisMonth) {
        return { canPay: false, reason: "PAID_THIS_MONTH" };
    }

    return { canPay: true };
}

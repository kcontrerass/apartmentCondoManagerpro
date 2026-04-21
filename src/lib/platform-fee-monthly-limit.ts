import { prisma } from "@/lib/db";
import { PlatformFeePaymentMethod, PlatformFeeStatus } from "@prisma/client";
import { reconcilePlatformFeePaymentsForUtcMonth } from "@/lib/platform-fee-dedupe";
import { syncPlatformCardPaymentFromRecurrenteForComplex } from "@/lib/platform-fee-recurrente-sync";
import { getUtcMonthBounds } from "@/lib/platform-fee-utc-bounds";

export type PlatformFeePaymentBlockReason = "PENDING" | "PAID_THIS_MONTH";

export { getUtcMonthBounds } from "@/lib/platform-fee-utc-bounds";

/**
 * Un complejo puede iniciar como máximo un cobro de suscripción a la plataforma por mes calendario (UTC).
 * Solo una transferencia bancaria pendiente de verificación bloquea un nuevo cobro; la tarjeta se confirma
 * en la pasarela y no usa «pendiente» como bloqueo (ver checkout: se reemplaza el intento anterior).
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

    const pendingBank = await prisma.platformFeePayment.findFirst({
        where: {
            complexId,
            status: PlatformFeeStatus.PENDING,
            paymentMethod: PlatformFeePaymentMethod.BANK_TRANSFER,
        },
        select: { id: true, paymentMethod: true },
    });
    if (pendingBank) {
        return {
            canPay: false,
            reason: "PENDING",
            pendingPaymentMethod: pendingBank.paymentMethod,
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

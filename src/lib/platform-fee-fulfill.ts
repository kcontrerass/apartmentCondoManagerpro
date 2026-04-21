import { prisma } from "@/lib/db";
import { PlatformFeeStatus } from "@prisma/client";
import { createPlatformSubscriptionInvoice } from "@/lib/platform-fee-invoice";
import { reconcilePlatformFeePaymentsForUtcMonth } from "@/lib/platform-fee-dedupe";

/**
 * Si el pago ya está PAID y no tiene factura vinculada, crea o reutiliza INV-PLAT-* y actualiza invoiceId.
 * Sirve para pagos antiguos o reintentos de webhook.
 */
export async function syncPlatformFeeInvoiceForPaidPayment(paymentId: string): Promise<void> {
    const payment = await prisma.platformFeePayment.findUnique({
        where: { id: paymentId },
    });
    if (!payment || payment.status !== PlatformFeeStatus.PAID || payment.invoiceId) {
        return;
    }
    try {
        await prisma.$transaction(async (tx) => {
            const paidAt = payment.paidAt ?? new Date();
            const invId = await createPlatformSubscriptionInvoice(
                tx,
                {
                    id: payment.id,
                    complexId: payment.complexId,
                    amountCents: payment.amountCents,
                    periodMonths: payment.periodMonths,
                    paymentMethod: payment.paymentMethod,
                },
                paidAt
            );
            if (invId) {
                await tx.platformFeePayment.update({
                    where: { id: paymentId },
                    data: { invoiceId: invId },
                });
            }
        });
    } catch (e) {
        console.error("[SYNC_PLATFORM_FEE_INVOICE]", e);
    }
}

export async function fulfillPlatformFeePayment(paymentId: string): Promise<{
    ok: boolean;
    reason?: string;
}> {
    const payment = await prisma.platformFeePayment.findUnique({
        where: { id: paymentId },
        include: { complex: true },
    });

    if (!payment) {
        return { ok: false, reason: "payment_not_found" };
    }
    if (payment.status === PlatformFeeStatus.PAID) {
        await syncPlatformFeeInvoiceForPaidPayment(paymentId);
        return { ok: true };
    }
    if (payment.status === PlatformFeeStatus.CANCELLED) {
        return { ok: false, reason: "cancelled" };
    }

    const months = payment.periodMonths;
    await prisma.$transaction(async (tx) => {
        const paidAt = new Date();
        let invoiceId = payment.invoiceId;

        if (!invoiceId) {
            invoiceId = await createPlatformSubscriptionInvoice(
                tx,
                {
                    id: payment.id,
                    complexId: payment.complexId,
                    amountCents: payment.amountCents,
                    periodMonths: payment.periodMonths,
                    paymentMethod: payment.paymentMethod,
                },
                paidAt
            );
        }

        await tx.platformFeePayment.update({
            where: { id: paymentId },
            data: {
                status: PlatformFeeStatus.PAID,
                paidAt,
                ...(invoiceId ? { invoiceId } : {}),
            },
        });

        const complex = await tx.complex.findUnique({
            where: { id: payment.complexId },
            select: { platformPaidUntil: true },
        });

        const now = paidAt;
        const base =
            complex?.platformPaidUntil && complex.platformPaidUntil > now
                ? complex.platformPaidUntil
                : now;
        const until = new Date(base);
        until.setMonth(until.getMonth() + months);

        await tx.complex.update({
            where: { id: payment.complexId },
            data: { platformPaidUntil: until },
        });
    });

    await reconcilePlatformFeePaymentsForUtcMonth(payment.complexId, new Date());

    return { ok: true };
}

/**
 * Extiende `platform_paid_until` sin fila de pago (p. ej. transferencia verificada manualmente por el operador).
 * Misma regla de fechas que al completar un pago PAID.
 */
export async function extendComplexPlatformSubscriptionManually(
    complexId: string,
    periodMonths: number
): Promise<{ ok: boolean; platformPaidUntil?: Date; reason?: string }> {
    const months = Math.max(1, Math.min(120, Math.floor(periodMonths)));
    try {
        const complex = await prisma.complex.findUnique({
            where: { id: complexId },
            select: { id: true, platformPaidUntil: true },
        });
        if (!complex) {
            return { ok: false, reason: "complex_not_found" };
        }

        const now = new Date();
        const base =
            complex.platformPaidUntil && complex.platformPaidUntil > now
                ? complex.platformPaidUntil
                : now;
        const until = new Date(base);
        until.setMonth(until.getMonth() + months);

        await prisma.complex.update({
            where: { id: complexId },
            data: { platformPaidUntil: until },
        });

        await reconcilePlatformFeePaymentsForUtcMonth(complexId, new Date());

        return { ok: true, platformPaidUntil: until };
    } catch (e) {
        console.error("[EXTEND_PLATFORM_SUBSCRIPTION_MANUAL]", e);
        return { ok: false, reason: "update_failed" };
    }
}

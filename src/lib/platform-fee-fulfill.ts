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

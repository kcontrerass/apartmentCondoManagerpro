import { InvoiceCategory, type PaymentMethod, type PlatformFeePaymentMethod, type Prisma } from "@prisma/client";

type PlatformFeePaymentRow = {
    id: string;
    complexId: string;
    amountCents: number;
    periodMonths: number;
    paymentMethod: PlatformFeePaymentMethod;
};

function toInvoicePaymentMethod(method: PlatformFeePaymentMethod): PaymentMethod {
    return method === "BANK_TRANSFER" ? "TRANSFER" : "CARD";
}

export function platformSubscriptionInvoiceNumber(paymentId: string): string {
    return `INV-PLAT-${paymentId}`;
}

/**
 * Crea factura PAID por suscripción a la plataforma, facturada al complejo (sin unidad).
 * Idempotente: si ya existe factura con número INV-PLAT-{paymentId}, devuelve su id.
 */
export async function createPlatformSubscriptionInvoice(
    tx: Prisma.TransactionClient,
    payment: PlatformFeePaymentRow,
    paidAt: Date
): Promise<string | null> {
    const number = platformSubscriptionInvoiceNumber(payment.id);
    const already = await tx.invoice.findUnique({
        where: { number },
        select: { id: true },
    });
    if (already) {
        return already.id;
    }

    const month = paidAt.getMonth() + 1;
    const year = paidAt.getFullYear();
    const totalAmount = payment.amountCents / 100;
    const description =
        payment.periodMonths <= 1
            ? "Suscripción plataforma — uso del software (1 mes)"
            : `Suscripción plataforma — uso del software (${payment.periodMonths} meses)`;

    const invoice = await tx.invoice.create({
        data: {
            number,
            month,
            year,
            dueDate: paidAt,
            totalAmount,
            status: "PAID",
            category: InvoiceCategory.PLATFORM_SUBSCRIPTION,
            unitId: null,
            complexId: payment.complexId,
            paymentMethod: toInvoicePaymentMethod(payment.paymentMethod),
            items: {
                create: {
                    description,
                    amount: totalAmount,
                },
            },
        },
    });

    return invoice.id;
}

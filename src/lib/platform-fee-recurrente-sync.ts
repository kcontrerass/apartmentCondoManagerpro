import { prisma } from "@/lib/db";
import { PlatformFeePaymentMethod, PlatformFeeStatus } from "@prisma/client";
import { recurrente } from "@/lib/recurrente";
import { getPlatformRecurrenteKeys } from "@/lib/platform-billing";
import { fulfillPlatformFeePayment } from "@/lib/platform-fee-fulfill";
import { isRecurrenteCheckoutPaid } from "@/lib/recurrente-checkout-paid";

/**
 * Si hay un cobro de plataforma PENDING con tarjeta y Recurrente ya cobró,
 * actualiza a PAID (webhook o página de éxito a veces no llegan).
 */
export async function syncPlatformCardPaymentFromRecurrenteForComplex(complexId: string): Promise<boolean> {
    const keys = await getPlatformRecurrenteKeys();
    if (!keys?.publicKey || !keys?.secretKey) {
        return false;
    }

    const pendings = await prisma.platformFeePayment.findMany({
        where: {
            complexId,
            status: PlatformFeeStatus.PENDING,
            paymentMethod: PlatformFeePaymentMethod.CARD,
            recurrenteCheckoutId: { not: null },
        },
        orderBy: { createdAt: "desc" },
        take: 8,
    });

    for (const p of pendings) {
        const cid = p.recurrenteCheckoutId;
        if (!cid) continue;
        try {
            const checkout = await recurrente.checkouts.retrieve(cid, keys);
            if (!checkout) continue;
            if (!isRecurrenteCheckoutPaid(checkout)) continue;
            const result = await fulfillPlatformFeePayment(p.id);
            if (result.ok) {
                return true;
            }
        } catch (e) {
            console.error("[PLATFORM_FEE_RECURRENTE_SYNC]", p.id, e);
        }
    }

    return false;
}

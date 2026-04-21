import { prisma } from "@/lib/db";
import { PlatformFeePaymentMethod, PlatformFeeStatus } from "@prisma/client";
import { recurrente } from "@/lib/recurrente";
import { getPlatformRecurrenteKeys } from "@/lib/platform-billing";
import { fulfillPlatformFeePayment } from "@/lib/platform-fee-fulfill";
import {
    isRecurrenteCheckoutAbandoned,
    isRecurrenteCheckoutPaid,
} from "@/lib/recurrente-checkout-paid";

export type SyncPlatformCardPaymentOptions = {
    /**
     * Tras volver del hosted checkout (p. ej. botón «atrás»): si Recurrente aún no marca pagado,
     * cancela el PENDING. No usar en polling genérico (puede haber otro tab completando el pago).
     */
    abandonIfNotPaid?: boolean;
};

/**
 * Si el checkout sigue sin pagarse tras este tiempo, damos por abandonado el intento.
 * Evita bloqueo cuando el usuario usa «atrás» y no pasa por /payments/success (Recurrente a veces
 * deja el checkout «abierto»). Valor conservador para no chocar con 3DS lento; si hace falta antes,
 * sigue existiendo liberar intento en la UI.
 */
const STALE_PENDING_CARD_MS = 20 * 60 * 1000;

/**
 * Si hay un cobro de plataforma PENDING con tarjeta y Recurrente ya cobró,
 * actualiza a PAID (webhook o página de éxito a veces no llegan).
 * Si Recurrente indica abandono o el intento es viejo sin pago, marca CANCELLED.
 */
export async function syncPlatformCardPaymentFromRecurrenteForComplex(
    complexId: string,
    options?: SyncPlatformCardPaymentOptions
): Promise<boolean> {
    const abandonIfNotPaid = options?.abandonIfNotPaid === true;
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

    const now = Date.now();

    for (const p of pendings) {
        const cid = p.recurrenteCheckoutId;
        if (!cid) continue;
        const ageMs = now - p.createdAt.getTime();
        const stale = ageMs >= STALE_PENDING_CARD_MS;

        try {
            const checkout = await recurrente.checkouts.retrieve(cid, keys);

            if (checkout && isRecurrenteCheckoutPaid(checkout)) {
                const result = await fulfillPlatformFeePayment(p.id);
                if (result.ok) {
                    return true;
                }
                continue;
            }

            if (abandonIfNotPaid) {
                await prisma.platformFeePayment.update({
                    where: { id: p.id },
                    data: { status: PlatformFeeStatus.CANCELLED },
                });
                continue;
            }

            if (checkout && isRecurrenteCheckoutAbandoned(checkout)) {
                await prisma.platformFeePayment.update({
                    where: { id: p.id },
                    data: { status: PlatformFeeStatus.CANCELLED },
                });
                continue;
            }

            if (!checkout && stale) {
                await prisma.platformFeePayment.update({
                    where: { id: p.id },
                    data: { status: PlatformFeeStatus.CANCELLED },
                });
                continue;
            }

            if (checkout && stale) {
                await prisma.platformFeePayment.update({
                    where: { id: p.id },
                    data: { status: PlatformFeeStatus.CANCELLED },
                });
            }
        } catch (e) {
            console.error("[PLATFORM_FEE_RECURRENTE_SYNC]", p.id, e);
        }
    }

    return false;
}

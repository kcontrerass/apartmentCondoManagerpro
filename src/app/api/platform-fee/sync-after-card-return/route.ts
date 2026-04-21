import { auth } from "@/auth";
import { Role } from "@/types/roles";
import { apiError, apiOk } from "@/lib/api-response";
import { findComplexForPlatformFeeByUser } from "@/lib/find-admin-complex-platform-fee";
import { isPrismaTableMissingError } from "@/lib/prisma-request-errors";
import { syncPlatformCardPaymentFromRecurrenteForComplex } from "@/lib/platform-fee-recurrente-sync";

/**
 * Tras volver del checkout de Recurrente en la misma pestaña (p. ej. «atrás» del navegador).
 * Solo debe llamarse cuando el cliente marcó PLATFORM_CARD_CHECKOUT_SESSION_KEY al iniciar el pago.
 */
export async function POST() {
    try {
        const session = await auth();
        if (
            !session?.user ||
            (session.user.role !== Role.ADMIN && session.user.role !== Role.BOARD_OF_DIRECTORS)
        ) {
            return apiError({ code: "FORBIDDEN", message: "No autorizado" }, 403);
        }

        const complex = await findComplexForPlatformFeeByUser(session.user.id, session.user.role);
        if (!complex) {
            return apiError({ code: "NOT_FOUND", message: "Sin complejo asignado" }, 404);
        }

        await syncPlatformCardPaymentFromRecurrenteForComplex(complex.id, { abandonIfNotPaid: true });

        return apiOk({ synced: true });
    } catch (error: unknown) {
        console.error("[PLATFORM_FEE_SYNC_AFTER_CARD_RETURN]", error);
        if (isPrismaTableMissingError(error, "platform_fee_payments")) {
            return apiError(
                {
                    code: "PLATFORM_BILLING_NOT_MIGRATED",
                    message: "La tabla de pagos de plataforma no está disponible.",
                },
                503
            );
        }
        return apiError({ code: "INTERNAL_ERROR", message: "Error al sincronizar" }, 500);
    }
}

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
import { PlatformFeePaymentMethod, PlatformFeeStatus } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { findComplexForPlatformFeeByUser } from "@/lib/find-admin-complex-platform-fee";

/**
 * Libera un intento de pago con tarjeta abandonado (sigue en PENDING) para poder abrir otro checkout.
 * No aplica a transferencias bancarias pendientes de confirmación.
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

        const pending = await prisma.platformFeePayment.findFirst({
            where: {
                complexId: complex.id,
                status: PlatformFeeStatus.PENDING,
                paymentMethod: PlatformFeePaymentMethod.CARD,
            },
            orderBy: { createdAt: "desc" },
            select: { id: true },
        });

        if (!pending) {
            return apiError(
                { code: "NOT_FOUND", message: "No hay un pago con tarjeta pendiente para liberar" },
                404
            );
        }

        await prisma.platformFeePayment.update({
            where: { id: pending.id },
            data: { status: PlatformFeeStatus.CANCELLED },
        });

        return apiOk({ released: true });
    } catch (e: unknown) {
        console.error("[PLATFORM_FEE_RELEASE_CARD]", e);
        return apiError({ code: "INTERNAL_ERROR", message: "Error al liberar el intento" }, 500);
    }
}

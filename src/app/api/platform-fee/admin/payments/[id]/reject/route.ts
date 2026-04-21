import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { apiError, apiOk } from "@/lib/api-response";
import { Role } from "@/types/roles";
import { PlatformFeePaymentMethod, PlatformFeeStatus } from "@prisma/client";

/**
 * Rechaza una transferencia pendiente: el administrador del complejo puede volver a usar los botones de pago.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
            return apiError({ code: "FORBIDDEN", message: "Solo súper administrador" }, 403);
        }

        const { id } = await params;
        const payment = await prisma.platformFeePayment.findUnique({
            where: { id },
        });

        if (!payment) {
            return apiError({ code: "NOT_FOUND", message: "Pago no encontrado" }, 404);
        }
        if (payment.status !== PlatformFeeStatus.PENDING) {
            return apiError({ code: "INVALID_STATE", message: "Solo se pueden rechazar pagos pendientes" }, 400);
        }
        if (payment.paymentMethod !== PlatformFeePaymentMethod.BANK_TRANSFER) {
            return apiError(
                { code: "INVALID_METHOD", message: "Solo aplica a transferencias bancarias pendientes de verificación" },
                400
            );
        }

        await prisma.platformFeePayment.update({
            where: { id },
            data: { status: PlatformFeeStatus.CANCELLED },
        });

        return apiOk({ rejected: true });
    } catch (error: unknown) {
        console.error("[PLATFORM_FEE_REJECT]", error);
        return apiError({ code: "INTERNAL_ERROR", message: "Error al rechazar el pago" }, 500);
    }
}

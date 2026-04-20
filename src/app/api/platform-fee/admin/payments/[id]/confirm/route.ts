import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { fulfillPlatformFeePayment } from "@/lib/platform-fee-fulfill";
import { apiError, apiOk } from "@/lib/api-response";
import { Role } from "@/types/roles";
import { PlatformFeePaymentMethod, PlatformFeeStatus } from "@prisma/client";

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
            return apiError({ code: "INVALID_STATE", message: "Solo se pueden confirmar pagos pendientes" }, 400);
        }
        if (payment.paymentMethod !== PlatformFeePaymentMethod.BANK_TRANSFER) {
            return apiError(
                { code: "INVALID_METHOD", message: "Solo aplica a pagos registrados por transferencia bancaria" },
                400
            );
        }

        const result = await fulfillPlatformFeePayment(id);
        if (!result.ok) {
            return apiError(
                { code: "FULFILL_FAILED", message: result.reason ?? "No se pudo registrar el pago" },
                400
            );
        }

        return apiOk({ confirmed: true });
    } catch (error: unknown) {
        console.error("[PLATFORM_FEE_CONFIRM]", error);
        return apiError({ code: "INTERNAL_ERROR", message: "Error al confirmar pago" }, 500);
    }
}

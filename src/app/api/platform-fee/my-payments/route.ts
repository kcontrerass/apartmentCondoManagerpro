import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
import { PlatformFeePaymentMethod, PlatformFeeStatus } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { isPrismaTableMissingError } from "@/lib/prisma-request-errors";
import { getUtcMonthBounds } from "@/lib/platform-fee-utc-bounds";
import { syncPlatformFeeInvoiceForPaidPayment } from "@/lib/platform-fee-fulfill";
import { findComplexForPlatformFeeByUser } from "@/lib/find-admin-complex-platform-fee";
import { syncPlatformCardPaymentFromRecurrenteForComplex } from "@/lib/platform-fee-recurrente-sync";

const invoiceSelect = {
    id: true,
    number: true,
    month: true,
    year: true,
    status: true,
} as const;

/**
 * Historial de pagos de suscripción a la plataforma del complejo del administrador.
 * No incluye intentos PENDING con tarjeta: esos solo existen en Recurrente hasta que se confirma
 * el cobro (entonces pasan a PAID automáticamente). Sí se listan transferencias PENDING (verificación manual).
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return apiError({ code: "UNAUTHORIZED", message: "No autorizado" }, 401);
        }
        if (session.user.role !== Role.ADMIN && session.user.role !== Role.BOARD_OF_DIRECTORS) {
            return apiError({ code: "FORBIDDEN", message: "Solo administrador o junta directiva" }, 403);
        }

        const complex = await findComplexForPlatformFeeByUser(session.user.id, session.user.role);
        if (!complex) {
            return apiError({ code: "NOT_FOUND", message: "Sin complejo asignado" }, 404);
        }

        await syncPlatformCardPaymentFromRecurrenteForComplex(complex.id);

        const { start, end } = getUtcMonthBounds();
        const latestPaidThisMonth = await prisma.platformFeePayment.findFirst({
            where: {
                complexId: complex.id,
                status: PlatformFeeStatus.PAID,
                paidAt: { gte: start, lte: end },
            },
            orderBy: { paidAt: "desc" },
            select: { id: true },
        });
        if (latestPaidThisMonth) {
            await syncPlatformFeeInvoiceForPaidPayment(latestPaidThisMonth.id);
        }

        const payments = await prisma.platformFeePayment.findMany({
            where: {
                complexId: complex.id,
                status: { not: PlatformFeeStatus.CANCELLED },
                OR: [
                    { status: { not: PlatformFeeStatus.PENDING } },
                    { paymentMethod: { not: PlatformFeePaymentMethod.CARD } },
                ],
            },
            orderBy: { createdAt: "desc" },
            take: 200,
            include: {
                invoice: {
                    select: invoiceSelect,
                },
            },
        });

        return apiOk({ payments });
    } catch (error: unknown) {
        console.error("[PLATFORM_FEE_MY_PAYMENTS]", error);
        if (isPrismaTableMissingError(error, "platform_fee_payments")) {
            return apiError(
                {
                    code: "PLATFORM_BILLING_NOT_MIGRATED",
                    message: "La tabla de pagos de plataforma no está disponible.",
                },
                503
            );
        }
        return apiError({ code: "INTERNAL_ERROR", message: "Error al cargar historial" }, 500);
    }
}

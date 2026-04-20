import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
import { PlatformFeeStatus } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { isPrismaTableMissingError } from "@/lib/prisma-request-errors";
import { getUtcMonthBounds } from "@/lib/platform-fee-utc-bounds";
import { syncPlatformFeeInvoiceForPaidPayment } from "@/lib/platform-fee-fulfill";

const invoiceSelect = {
    id: true,
    number: true,
    month: true,
    year: true,
    status: true,
} as const;

/**
 * Historial de pagos de suscripción a la plataforma del complejo del administrador.
 * Incluye todos los intentos recientes (no solo el mes en curso).
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return apiError({ code: "UNAUTHORIZED", message: "No autorizado" }, 401);
        }
        if (session.user.role !== Role.ADMIN) {
            return apiError({ code: "FORBIDDEN", message: "Solo administrador de complejo" }, 403);
        }

        const complex = await prisma.complex.findFirst({
            where: { adminId: session.user.id },
            select: { id: true },
        });
        if (!complex) {
            return apiError({ code: "NOT_FOUND", message: "Sin complejo asignado" }, 404);
        }

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

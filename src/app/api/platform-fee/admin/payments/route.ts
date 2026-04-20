import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@/types/roles";
import { PlatformFeeStatus } from "@prisma/client";
import { apiError, apiOk } from "@/lib/api-response";
import { isPrismaTableMissingError } from "@/lib/prisma-request-errors";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return apiError({ code: "UNAUTHORIZED", message: "No autorizado" }, 401);
        }

        const isSuper = session.user.role === Role.SUPER_ADMIN;
        let scopedComplexId: string | undefined;

        if (isSuper) {
            // listado global
        } else if (session.user.role === Role.ADMIN) {
            const managed = await prisma.complex.findFirst({
                where: { adminId: session.user.id },
                select: { id: true },
            });
            if (!managed) {
                return apiError({ code: "NOT_FOUND", message: "Sin complejo asignado" }, 403);
            }
            scopedComplexId = managed.id;
        } else {
            return apiError({ code: "FORBIDDEN", message: "No autorizado" }, 403);
        }

        const { searchParams } = new URL(request.url);
        const q = searchParams.get("q")?.trim() ?? "";
        const complexIdParam = searchParams.get("complexId")?.trim() ?? "";

        if (isSuper && complexIdParam) {
            const exists = await prisma.complex.findUnique({
                where: { id: complexIdParam },
                select: { id: true },
            });
            if (!exists) {
                return apiError({ code: "NOT_FOUND", message: "Complejo no encontrado" }, 404);
            }
            scopedComplexId = exists.id;
        }

        const searchClause = q
            ? {
                  OR: [
                      { id: { contains: q } },
                      ...(scopedComplexId ? [] : [{ complex: { name: { contains: q } } }]),
                      { recurrenteCheckoutId: { contains: q } },
                  ],
              }
            : undefined;

        const where =
            scopedComplexId && searchClause
                ? { AND: [{ complexId: scopedComplexId }, searchClause] }
                : scopedComplexId
                  ? { complexId: scopedComplexId }
                  : searchClause;

        const includeCancelled = searchParams.get("includeCancelled") === "1";
        const finalWhere = !includeCancelled
            ? where
                ? { AND: [where, { status: { not: PlatformFeeStatus.CANCELLED } }] }
                : { status: { not: PlatformFeeStatus.CANCELLED } }
            : where;

        const payments = await prisma.platformFeePayment.findMany({
            where: finalWhere,
            orderBy: { createdAt: "desc" },
            take: 500,
            include: {
                complex: {
                    select: { id: true, name: true },
                },
                invoice: {
                    select: { id: true, number: true },
                },
            },
        });

        return apiOk({ payments, scope: isSuper ? "all" : "complex" });
    } catch (error: unknown) {
        console.error("[PLATFORM_FEE_ADMIN_LIST]", error);
        if (isPrismaTableMissingError(error, "platform_fee_payments")) {
            return apiError(
                {
                    code: "PLATFORM_BILLING_NOT_MIGRATED",
                    message:
                        "La tabla platform_fee_payments no existe. Ejecuta prisma migrate deploy en el servidor.",
                },
                503
            );
        }
        return apiError({ code: "INTERNAL_ERROR", message: "Error al listar pagos" }, 500);
    }
}

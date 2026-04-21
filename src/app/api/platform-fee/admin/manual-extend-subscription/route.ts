import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/api-response";
import { extendComplexPlatformSubscriptionManually } from "@/lib/platform-fee-fulfill";
import { getPlatformSubscriptionPeriodMonths } from "@/lib/platform-billing";
import { Role } from "@/types/roles";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
            return apiError({ code: "FORBIDDEN", message: "Solo súper administrador" }, 403);
        }

        const body = (await request.json()) as { complexId?: string };
        const complexId = typeof body.complexId === "string" ? body.complexId.trim() : "";
        if (!complexId) {
            return apiError({ code: "VALIDATION", message: "Indica el complejo" }, 400);
        }

        const periodMonths = await getPlatformSubscriptionPeriodMonths();
        const result = await extendComplexPlatformSubscriptionManually(complexId, periodMonths);

        if (!result.ok) {
            if (result.reason === "complex_not_found") {
                return apiError({ code: "NOT_FOUND", message: "Complejo no encontrado" }, 404);
            }
            return apiError({ code: "UPDATE_FAILED", message: "No se pudo actualizar la vigencia" }, 500);
        }

        return apiOk({
            platformPaidUntil: result.platformPaidUntil?.toISOString() ?? null,
            periodMonths,
        });
    } catch (e) {
        console.error("[MANUAL_EXTEND_PLATFORM_SUBSCRIPTION]", e);
        return apiError({ code: "INTERNAL_ERROR", message: "Error al procesar la solicitud" }, 500);
    }
}

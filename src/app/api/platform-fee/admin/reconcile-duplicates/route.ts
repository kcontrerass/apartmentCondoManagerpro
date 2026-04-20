import { auth } from "@/auth";
import { Role } from "@/types/roles";
import { apiError, apiOk } from "@/lib/api-response";
import { reconcileAllPlatformFeePaymentsRecentMonths } from "@/lib/platform-fee-dedupe";

/**
 * POST — Súper admin: normaliza duplicados (mismo complejo, mismo mes UTC).
 * Marca como cancelados los cobros imposibles; no borra filas.
 */
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user || session.user.role !== Role.SUPER_ADMIN) {
            return apiError({ code: "FORBIDDEN", message: "Solo súper administrador" }, 403);
        }

        const { cancelled } = await reconcileAllPlatformFeePaymentsRecentMonths(36);
        return apiOk({ cancelled });
    } catch (e: unknown) {
        console.error("[PLATFORM_FEE_RECONCILE]", e);
        return apiError({ code: "INTERNAL_ERROR", message: "Error al normalizar pagos" }, 500);
    }
}

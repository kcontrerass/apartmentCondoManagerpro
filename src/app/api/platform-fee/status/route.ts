import { auth } from "@/auth";
import { Role } from "@/types/roles";
import { apiError, apiOk } from "@/lib/api-response";
import {
    getPlatformRecurrenteKeys,
    getPlatformSubscriptionBankInstructions,
    getPlatformSubscriptionPeriodMonths,
    getPlatformSubscriptionPriceGtq,
} from "@/lib/platform-billing";
import { findAdminComplexForPlatformFee } from "@/lib/find-admin-complex-platform-fee";
import { getPlatformFeePaymentEligibility } from "@/lib/platform-fee-monthly-limit";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user) {
            return apiError({ code: "UNAUTHORIZED", message: "No autorizado" }, 401);
        }

        if (session.user.role === Role.SUPER_ADMIN) {
            const bank = await getPlatformSubscriptionBankInstructions();
            return apiOk({
                role: Role.SUPER_ADMIN,
                keysConfigured: !!(await getPlatformRecurrenteKeys()),
                bankTransferConfigured: !!bank,
                priceGtq: await getPlatformSubscriptionPriceGtq(),
                periodMonths: await getPlatformSubscriptionPeriodMonths(),
            });
        }

        if (session.user.role !== Role.ADMIN) {
            return apiError({ code: "FORBIDDEN", message: "No autorizado" }, 403);
        }

        const complex = await findAdminComplexForPlatformFee(session.user.id);

        if (!complex) {
            return apiError({ code: "NOT_FOUND", message: "Sin complejo asignado" }, 404);
        }

        const bank = await getPlatformSubscriptionBankInstructions();
        const eligibility = await getPlatformFeePaymentEligibility(complex.id);
        return apiOk({
            role: Role.ADMIN,
            complexId: complex.id,
            complexName: complex.name,
            platformPaidUntil: complex.platformPaidUntil,
            priceGtq: await getPlatformSubscriptionPriceGtq(),
            periodMonths: await getPlatformSubscriptionPeriodMonths(),
            keysConfigured: !!(await getPlatformRecurrenteKeys()),
            bankTransferConfigured: !!bank,
            canInitiatePayment: eligibility.canPay,
            paymentBlockReason: eligibility.canPay ? null : eligibility.reason,
            pendingPaymentMethod:
                !eligibility.canPay && eligibility.reason === "PENDING"
                    ? eligibility.pendingPaymentMethod ?? null
                    : null,
        });
    } catch (error: unknown) {
        console.error("[PLATFORM_FEE_STATUS]", error);
        return apiError({ code: "INTERNAL_ERROR", message: "Error al consultar estado" }, 500);
    }
}

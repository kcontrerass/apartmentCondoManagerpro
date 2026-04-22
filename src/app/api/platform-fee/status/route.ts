import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
import { apiError, apiOk } from "@/lib/api-response";
import {
    getPlatformRecurrenteKeys,
    getPlatformSubscriptionBankInstructions,
    getPlatformSubscriptionPeriodMonths,
    getPlatformSubscriptionPriceGtq,
    getPlatformSubscriptionProofPhone,
} from "@/lib/platform-billing";
import { findComplexForPlatformFeeByUser } from "@/lib/find-admin-complex-platform-fee";
import { getPlatformFeePaymentEligibility } from "@/lib/platform-fee-monthly-limit";
import { getPlatformSubscriptionAccessForComplex } from "@/lib/platform-subscription-access";
import { PLATFORM_SUBSCRIPTION_TERMS_VERSION } from "@/lib/platform-subscription-terms";
import { PlatformFeePaymentMethod, PlatformFeeStatus } from "@prisma/client";

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

        if (session.user.role !== Role.ADMIN && session.user.role !== Role.BOARD_OF_DIRECTORS) {
            return apiError({ code: "FORBIDDEN", message: "No autorizado" }, 403);
        }

        const complex = await findComplexForPlatformFeeByUser(session.user.id, session.user.role);

        if (!complex) {
            return apiError({ code: "NOT_FOUND", message: "Sin complejo asignado" }, 404);
        }

        const bank = await getPlatformSubscriptionBankInstructions();
        const proofPhone = await getPlatformSubscriptionProofPhone();
        const eligibility = await getPlatformFeePaymentEligibility(complex.id);
        const access = await getPlatformSubscriptionAccessForComplex(complex.id);

        let pendingBankTransfer: {
            paymentId: string;
            reference: string;
            instructions: string;
            amountGtq: number;
            currency: string;
            periodMonths: number;
            proofPhone: string | null;
        } | null = null;

        if (
            !eligibility.canPay &&
            eligibility.reason === "PENDING" &&
            eligibility.pendingPaymentMethod === PlatformFeePaymentMethod.BANK_TRANSFER &&
            bank
        ) {
            const pending = await prisma.platformFeePayment.findFirst({
                where: {
                    complexId: complex.id,
                    status: PlatformFeeStatus.PENDING,
                    paymentMethod: PlatformFeePaymentMethod.BANK_TRANSFER,
                },
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    amountCents: true,
                    currency: true,
                    periodMonths: true,
                },
            });
            if (pending) {
                pendingBankTransfer = {
                    paymentId: pending.id,
                    reference: pending.id,
                    instructions: bank,
                    amountGtq: pending.amountCents / 100,
                    currency: pending.currency,
                    periodMonths: pending.periodMonths,
                    proofPhone,
                };
            }
        }

        return apiOk({
            role: session.user.role,
            complexId: complex.id,
            complexName: complex.name,
            platformPaidUntil: complex.platformPaidUntil,
            accessDeadline: access.accessDeadline.toISOString(),
            subscriptionGraceDays: access.graceDays,
            platformAccessAllowed: access.allowed,
            priceGtq: await getPlatformSubscriptionPriceGtq(),
            periodMonths: await getPlatformSubscriptionPeriodMonths(),
            keysConfigured: !!(await getPlatformRecurrenteKeys()),
            bankTransferConfigured: !!bank,
            subscriptionProofPhone: proofPhone,
            subscriptionTermsVersion: PLATFORM_SUBSCRIPTION_TERMS_VERSION,
            paymentBlockReason: eligibility.canPay ? null : eligibility.reason,
            pendingPaymentMethod:
                !eligibility.canPay && eligibility.reason === "PENDING"
                    ? eligibility.pendingPaymentMethod ?? null
                    : null,
            pendingBankTransfer,
        });
    } catch (error: unknown) {
        console.error("[PLATFORM_FEE_STATUS]", error);
        return apiError({ code: "INTERNAL_ERROR", message: "Error al consultar estado" }, 500);
    }
}

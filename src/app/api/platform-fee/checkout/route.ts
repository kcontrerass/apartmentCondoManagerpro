import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@/types/roles";
import { PlatformFeePaymentMethod, PlatformFeeStatus } from "@prisma/client";
import { recurrente } from "@/lib/recurrente";
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
import { isPrismaTableMissingError } from "@/lib/prisma-request-errors";
import { PLATFORM_SUBSCRIPTION_TERMS_VERSION } from "@/lib/platform-subscription-terms";
import { resolveRecurrenteFeeConfig } from "@/lib/recurrente-fee-config";
import {
    buildRecurrenteCardCheckoutLineItemsWithConfig,
    computeRecurrenteCardAmountsWithConfig,
} from "@/lib/recurrente-fee-math";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return apiError({ code: "UNAUTHORIZED", message: "No autorizado" }, 401);
        }

        if (session.user.role !== Role.ADMIN && session.user.role !== Role.BOARD_OF_DIRECTORS) {
            return apiError(
                {
                    code: "FORBIDDEN",
                    message: "Solo el administrador o la junta directiva del complejo pueden pagar la suscripción",
                },
                403
            );
        }

        const complex = await findComplexForPlatformFeeByUser(session.user.id, session.user.role);

        if (!complex) {
            return apiError(
                { code: "NOT_FOUND", message: "No se encontró el complejo para iniciar el pago de suscripción" },
                404
            );
        }

        let method: PlatformFeePaymentMethod = PlatformFeePaymentMethod.CARD;
        let body: { method?: string; acceptTerms?: boolean; termsVersion?: string } = {};
        try {
            body = (await request.json()) as typeof body;
            if (body?.method === "BANK_TRANSFER") {
                method = PlatformFeePaymentMethod.BANK_TRANSFER;
            }
        } catch {
            /* cuerpo vacío → tarjeta */
        }

        if (
            body.acceptTerms !== true ||
            body.termsVersion !== PLATFORM_SUBSCRIPTION_TERMS_VERSION
        ) {
            return apiError(
                {
                    code: "TERMS_NOT_ACCEPTED",
                    message:
                        "Debes marcar la aceptación y tener la versión actual de los términos de uso y aspectos legales para continuar.",
                },
                400
            );
        }

        const termsAudit = {
            termsAcceptedAt: new Date(),
            termsVersion: PLATFORM_SUBSCRIPTION_TERMS_VERSION,
        };

        await prisma.platformFeePayment.updateMany({
            where: {
                complexId: complex.id,
                status: PlatformFeeStatus.PENDING,
                paymentMethod: PlatformFeePaymentMethod.CARD,
            },
            data: { status: PlatformFeeStatus.CANCELLED },
        });

        const eligibility = await getPlatformFeePaymentEligibility(complex.id);
        if (!eligibility.canPay) {
            if (eligibility.reason === "PENDING") {
                return apiError(
                    {
                        code: "PLATFORM_FEE_PENDING_EXISTS",
                        message:
                            "Hay una transferencia pendiente de verificación. Espera la confirmación del administrador de la plataforma antes de iniciar otro pago.",
                    },
                    409
                );
            }
            return apiError(
                {
                    code: "PLATFORM_FEE_MONTHLY_LIMIT",
                    message:
                        "Solo se permite un pago de suscripción a la plataforma por mes. Ya se registró un pago este mes.",
                },
                409
            );
        }

        const priceGtq = await getPlatformSubscriptionPriceGtq();
        const months = await getPlatformSubscriptionPeriodMonths();
        const amountCents = Math.round(priceGtq * 100);

        if (method === PlatformFeePaymentMethod.BANK_TRANSFER) {
            const instructions = await getPlatformSubscriptionBankInstructions();
            const proofPhone = await getPlatformSubscriptionProofPhone();
            if (!instructions) {
                return apiError(
                    {
                        code: "BANK_TRANSFER_NOT_CONFIGURED",
                        message:
                            "Las instrucciones de transferencia bancaria no están configuradas. Contacta al administrador del sistema.",
                    },
                    503
                );
            }

            const payment = await prisma.platformFeePayment.create({
                data: {
                    complexId: complex.id,
                    amountCents,
                    currency: "GTQ",
                    periodMonths: months,
                    paymentMethod: PlatformFeePaymentMethod.BANK_TRANSFER,
                    ...termsAudit,
                },
            });

            return apiOk({
                mode: "BANK_TRANSFER",
                paymentId: payment.id,
                amountGtq: priceGtq,
                currency: "GTQ",
                periodMonths: months,
                instructions,
                reference: payment.id,
                complexName: complex.name,
                proofPhone,
            });
        }

        const keys = await getPlatformRecurrenteKeys();
        if (!keys) {
            return apiError(
                {
                    code: "PLATFORM_GATEWAY_MISSING",
                    message:
                        "La pasarela de pago de la plataforma no está configurada. Contacta al administrador del sistema.",
                },
                503
            );
        }

        const payment = await prisma.platformFeePayment.create({
            data: {
                complexId: complex.id,
                amountCents,
                currency: "GTQ",
                periodMonths: months,
                paymentMethod: PlatformFeePaymentMethod.CARD,
                ...termsAudit,
            },
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const locale = request.headers.get("referer")?.includes("/en/") ? "en" : "es";
        const cancelReturnUrl = `${appUrl}/${locale}/dashboard/payments/cancel?scope=platform&platformFeePaymentId=${encodeURIComponent(payment.id)}`;

        const platFeeCfg = await resolveRecurrenteFeeConfig(keys);
        const platCard = computeRecurrenteCardAmountsWithConfig(amountCents, platFeeCfg);
        const checkoutSession = await recurrente.checkouts.create(
            {
                items: buildRecurrenteCardCheckoutLineItemsWithConfig(
                    { name: `Uso de plataforma — ${complex.name}`, currency: "GTQ" },
                    amountCents,
                    platFeeCfg
                ),
                // Un solo placeholder evita query duplicada `checkout_id=ch_…&checkout_id={CHECKOUT_SESSION_ID}`. Recurrente suele añadir `checkout_id` al redirect.
                success_url: `${appUrl}/${locale}/dashboard/payments/success?scope=platform&platformFeePaymentId=${encodeURIComponent(payment.id)}&session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: cancelReturnUrl,
                back_url: cancelReturnUrl,
                return_url: cancelReturnUrl,
                metadata: {
                    type: "PLATFORM_FEE",
                    platformFeePaymentId: payment.id,
                    complexId: complex.id,
                    recurrenteSurchargeCents: platCard.surchargeCents,
                },
            },
            keys
        );

        const checkoutId =
            (checkoutSession as { id?: string }).id ||
            (checkoutSession as { checkout_id?: string }).checkout_id ||
            null;

        if (checkoutId) {
            await prisma.platformFeePayment.update({
                where: { id: payment.id },
                data: { recurrenteCheckoutId: checkoutId },
            });
        }

        const url =
            (checkoutSession as { checkout_url?: string }).checkout_url ||
            (checkoutSession as { url?: string }).url;

        if (!url) {
            return apiError({ code: "CHECKOUT_URL_MISSING", message: "No se obtuvo URL de pago" }, 502);
        }

        return apiOk({ mode: "CARD", url, paymentId: payment.id });
    } catch (error: unknown) {
        console.error("[PLATFORM_FEE_CHECKOUT]", error);
        if (isPrismaTableMissingError(error, "platform_fee_payments")) {
            return apiError(
                {
                    code: "PLATFORM_BILLING_NOT_MIGRATED",
                    message:
                        "Falta la tabla de pagos de plataforma en la base de datos. Aplica la migración Prisma 20260422103000_platform_fee_payments (npx prisma migrate deploy) o contacta al administrador.",
                },
                503
            );
        }
        return apiError(
            {
                code: "CHECKOUT_ERROR",
                message: error instanceof Error ? error.message : "Error al crear el cobro",
            },
            500
        );
    }
}

import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@/types/roles";
import { PlatformFeePaymentMethod } from "@prisma/client";
import { recurrente } from "@/lib/recurrente";
import { apiError, apiOk } from "@/lib/api-response";
import {
    getPlatformRecurrenteKeys,
    getPlatformSubscriptionBankInstructions,
    getPlatformSubscriptionPeriodMonths,
    getPlatformSubscriptionPriceGtq,
} from "@/lib/platform-billing";
import { findAdminComplexForPlatformFee } from "@/lib/find-admin-complex-platform-fee";
import { getPlatformFeePaymentEligibility } from "@/lib/platform-fee-monthly-limit";
import { isPrismaTableMissingError } from "@/lib/prisma-request-errors";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return apiError({ code: "UNAUTHORIZED", message: "No autorizado" }, 401);
        }

        if (session.user.role !== Role.ADMIN) {
            return apiError(
                { code: "FORBIDDEN", message: "Solo el administrador del complejo puede pagar la suscripción" },
                403
            );
        }

        const complex = await findAdminComplexForPlatformFee(session.user.id);

        if (!complex) {
            return apiError(
                { code: "NOT_FOUND", message: "No tienes un complejo asignado como administrador" },
                404
            );
        }

        const eligibility = await getPlatformFeePaymentEligibility(complex.id);
        if (!eligibility.canPay) {
            if (eligibility.reason === "PENDING") {
                return apiError(
                    {
                        code: "PLATFORM_FEE_PENDING_EXISTS",
                        message:
                            "Ya hay un pago de suscripción pendiente para tu complejo. Espera la confirmación o completa el pago en curso antes de iniciar otro.",
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

        let method: PlatformFeePaymentMethod = PlatformFeePaymentMethod.CARD;
        try {
            const body = (await request.json()) as { method?: string };
            if (body?.method === "BANK_TRANSFER") {
                method = PlatformFeePaymentMethod.BANK_TRANSFER;
            }
        } catch {
            /* cuerpo vacío → tarjeta */
        }

        const priceGtq = await getPlatformSubscriptionPriceGtq();
        const months = await getPlatformSubscriptionPeriodMonths();
        const amountCents = Math.round(priceGtq * 100);

        if (method === PlatformFeePaymentMethod.BANK_TRANSFER) {
            const instructions = await getPlatformSubscriptionBankInstructions();
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
            },
        });

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const locale = request.headers.get("referer")?.includes("/en/") ? "en" : "es";
        const cancelReturnUrl = `${appUrl}/${locale}/dashboard/payments/cancel?scope=platform&platformFeePaymentId=${encodeURIComponent(payment.id)}`;

        const checkoutSession = await recurrente.checkouts.create(
            {
                items: [
                    {
                        name: `Uso de plataforma — ${complex.name}`,
                        currency: "GTQ",
                        amount_in_cents: amountCents,
                        quantity: 1,
                    },
                ],
                success_url: `${appUrl}/${locale}/dashboard/payments/success?session_id={checkout_session_id}&scope=platform`,
                cancel_url: cancelReturnUrl,
                back_url: cancelReturnUrl,
                return_url: cancelReturnUrl,
                metadata: {
                    type: "PLATFORM_FEE",
                    platformFeePaymentId: payment.id,
                    complexId: complex.id,
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

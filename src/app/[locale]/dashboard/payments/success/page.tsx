import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { recurrente } from "@/lib/recurrente";
import { prisma } from "@/lib/db";
import { getPlatformRecurrenteKeys } from "@/lib/platform-billing";
import { fulfillPlatformFeePayment } from "@/lib/platform-fee-fulfill";
import { syncPlatformCardPaymentFromRecurrenteForComplex } from "@/lib/platform-fee-recurrente-sync";
import {
    getRecurrenteCheckoutMetadata,
    isRecurrenteCheckoutPaid,
} from "@/lib/recurrente-checkout-paid";
import {
    type RecurrenteReturnSearchParams,
    resolveRecurrenteCheckoutIdFromSearchParams,
} from "@/lib/recurrente-return-session";
import { InvoiceCategory, PlatformFeePaymentMethod, PlatformFeeStatus } from "@prisma/client";

/** Evita que el botón «atrás» muestre una pantalla de éxito cacheada sin revalidar. */
export const dynamic = "force-dynamic";

type UiState = "paid" | "not_paid" | "verify_error" | "no_reference";

interface Props {
    params: Promise<{ locale: string }>;
    searchParams: Promise<
        RecurrenteReturnSearchParams & {
            scope?: string;
            platformFeePaymentId?: string;
        }
    >;
}

export default async function PaymentSuccessPage({ params, searchParams }: Props) {
    const { locale } = await params;
    const sp = await searchParams;
    let session_id = resolveRecurrenteCheckoutIdFromSearchParams(sp);
    const scope = sp.scope;
    const t = await getTranslations({ locale, namespace: "Payments.success" });

    let ui: UiState = "no_reference";
    let releasedPlatformAttempt = false;
    let platformPrepaidFromSync = false;

    if (!session_id && scope === "platform" && sp.platformFeePaymentId) {
        const pay = await prisma.platformFeePayment.findUnique({
            where: { id: sp.platformFeePaymentId },
            select: {
                recurrenteCheckoutId: true,
                complexId: true,
                status: true,
            },
        });
        if (pay?.recurrenteCheckoutId) {
            session_id = pay.recurrenteCheckoutId;
        } else if (pay?.complexId) {
            await syncPlatformCardPaymentFromRecurrenteForComplex(pay.complexId);
            const pay2 = await prisma.platformFeePayment.findUnique({
                where: { id: sp.platformFeePaymentId },
                select: {
                    recurrenteCheckoutId: true,
                    status: true,
                },
            });
            if (pay2?.status === PlatformFeeStatus.PAID) {
                platformPrepaidFromSync = true;
            } else if (pay2?.recurrenteCheckoutId) {
                session_id = pay2.recurrenteCheckoutId;
            }
        }
    }

    if (platformPrepaidFromSync) {
        ui = "paid";
    } else if (session_id) {
        try {
            const platformKeys = scope === "platform" ? await getPlatformRecurrenteKeys() : null;
            let checkout: unknown = null;
            if (scope === "platform" && platformKeys) {
                checkout = await recurrente.checkouts.retrieveWithRetry(session_id, platformKeys, {
                    maxAttempts: 5,
                    baseDelayMs: 400,
                });
            } else {
                checkout = await recurrente.checkouts.retrieve(
                    session_id,
                    platformKeys || undefined
                );
            }

            let recoveredPlatformPaid = false;
            if (!checkout && scope === "platform" && platformKeys) {
                const platformRow = await prisma.platformFeePayment.findFirst({
                    where: { recurrenteCheckoutId: session_id },
                    select: { id: true, complexId: true },
                });
                if (platformRow?.complexId) {
                    await syncPlatformCardPaymentFromRecurrenteForComplex(platformRow.complexId);
                    const latest = await prisma.platformFeePayment.findUnique({
                        where: { id: platformRow.id },
                        select: { status: true },
                    });
                    recoveredPlatformPaid = latest?.status === PlatformFeeStatus.PAID;
                }
            }

            if (!checkout && !recoveredPlatformPaid) {
                ui = "verify_error";
            } else if (recoveredPlatformPaid && !checkout) {
                ui = "paid";
            } else if (checkout) {
                const metadata = getRecurrenteCheckoutMetadata(checkout);
                const type = metadata.type;
                const isPaid = isRecurrenteCheckoutPaid(checkout);

                if (!isPaid) {
                    ui = "not_paid";
                    if (scope === "platform") {
                        const r = await prisma.platformFeePayment.updateMany({
                            where: {
                                recurrenteCheckoutId: session_id,
                                status: PlatformFeeStatus.PENDING,
                                paymentMethod: PlatformFeePaymentMethod.CARD,
                            },
                            data: { status: PlatformFeeStatus.CANCELLED },
                        });
                        releasedPlatformAttempt = r.count > 0;
                    }
                } else {
                    ui = "paid";

                    if (scope === "platform") {
                        let feeId =
                            metadata.platformFeePaymentId != null
                                ? String(metadata.platformFeePaymentId)
                                : null;
                        if (!feeId) {
                            const row = await prisma.platformFeePayment.findFirst({
                                where: { recurrenteCheckoutId: session_id },
                                select: { id: true },
                            });
                            feeId = row?.id ?? null;
                        }
                        if (feeId) {
                            await fulfillPlatformFeePayment(feeId);
                        }
                    }

                    if (scope !== "platform") {
                        if (type === "RESERVATION") {
                            const m = metadata as {
                                amenityId?: string;
                                startTime?: string;
                                endTime?: string;
                                notes?: string | null;
                                userId?: string;
                                totalAmount?: string | number;
                            };
                            const {
                                amenityId,
                                startTime,
                                endTime,
                                notes,
                                userId,
                                totalAmount,
                            } = m;

                            if (
                                typeof amenityId === "string" &&
                                typeof startTime === "string" &&
                                typeof endTime === "string" &&
                                typeof userId === "string" &&
                                totalAmount !== undefined
                            ) {
                                const start = new Date(startTime);
                                const end = new Date(endTime);

                                const existingRes = await prisma.reservation.findFirst({
                                    where: {
                                        userId,
                                        amenityId,
                                        startTime: start,
                                        endTime: end,
                                    },
                                });

                                if (!existingRes) {
                                    const user = await prisma.user.findUnique({
                                        where: { id: userId },
                                        include: {
                                            residentProfile: { include: { unit: true } },
                                        },
                                    });
                                    const unitId = user?.residentProfile?.unitId;
                                    const complexId = user?.residentProfile?.unit?.complexId;
                                    if (unitId && complexId) {
                                        const amount = Number(totalAmount);
                                        const invoiceNumber = `RES-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                                        const invoice = await prisma.invoice.create({
                                            data: {
                                                number: invoiceNumber,
                                                month: start.getUTCMonth() + 1,
                                                year: start.getUTCFullYear(),
                                                dueDate: new Date(),
                                                totalAmount: amount,
                                                status: "PAID",
                                                category: InvoiceCategory.UNIT_BILLING,
                                                unitId,
                                                complexId,
                                                paymentMethod: "CARD",
                                                items: {
                                                    create: {
                                                        description: "Reserva de amenidad (pagada con tarjeta)",
                                                        amount,
                                                    },
                                                },
                                            },
                                        });

                                        await prisma.reservation.create({
                                            data: {
                                                userId,
                                                amenityId,
                                                startTime: start,
                                                endTime: end,
                                                notes: typeof notes === "string" ? notes : undefined,
                                                status: "APPROVED",
                                                invoiceId: invoice.id,
                                            },
                                        });
                                        console.log(`Reservation created for user ${userId} after successful payment.`);
                                    }
                                }
                            }
                        } else {
                            const invoiceIdRaw = metadata.invoiceId;
                            if (invoiceIdRaw !== undefined && invoiceIdRaw !== null && String(invoiceIdRaw).length > 0) {
                                const invoiceId = String(invoiceIdRaw);
                                await prisma.invoice.updateMany({
                                    where: {
                                        id: invoiceId,
                                        status: { not: "PAID" },
                                        category: InvoiceCategory.UNIT_BILLING,
                                    },
                                    data: {
                                        status: "PAID",
                                        paymentMethod: "CARD",
                                        updatedAt: new Date(),
                                    },
                                });

                                const linkedReservation = await prisma.reservation.findUnique({
                                    where: { invoiceId },
                                });

                                if (linkedReservation) {
                                    await prisma.reservation.update({
                                        where: { id: linkedReservation.id },
                                        data: { status: "APPROVED" },
                                    });
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error verifying payment session:", error);
            if (scope === "platform") {
                try {
                    const platformKeys = await getPlatformRecurrenteKeys();
                    let complexId: string | null = null;
                    let feeRowId: string | null = null;
                    if (session_id) {
                        const platformRow = await prisma.platformFeePayment.findFirst({
                            where: { recurrenteCheckoutId: session_id },
                            select: { id: true, complexId: true },
                        });
                        complexId = platformRow?.complexId ?? null;
                        feeRowId = platformRow?.id ?? null;
                    } else if (sp.platformFeePaymentId) {
                        const platformRow = await prisma.platformFeePayment.findUnique({
                            where: { id: sp.platformFeePaymentId },
                            select: { id: true, complexId: true },
                        });
                        complexId = platformRow?.complexId ?? null;
                        feeRowId = platformRow?.id ?? null;
                    }
                    if (platformKeys && complexId && feeRowId) {
                        await syncPlatformCardPaymentFromRecurrenteForComplex(complexId);
                        const latest = await prisma.platformFeePayment.findUnique({
                            where: { id: feeRowId },
                            select: { status: true },
                        });
                        if (latest?.status === PlatformFeeStatus.PAID) {
                            ui = "paid";
                        } else {
                            ui = "verify_error";
                        }
                    } else {
                        ui = "verify_error";
                    }
                } catch {
                    ui = "verify_error";
                }
            } else {
                ui = "verify_error";
            }
        }
    }

    const backHref = scope === "platform" ? "/dashboard/platform-subscription" : "/dashboard/invoices";

    if (ui === "paid") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
                <Card className="max-w-md w-full p-8 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-success-600">check_circle</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("title")}</h1>
                        <p className="text-slate-600 dark:text-slate-400">{t("message")}</p>
                    </div>

                    <div className="pt-4">
                        <Link href={backHref}>
                            <Button variant="primary" className="w-full">
                                {scope === "platform" ? t("backToSubscription") : t("backToInvoices")}
                            </Button>
                        </Link>
                    </div>

                    <p className="text-xs text-slate-500">{t("note")}</p>
                </Card>
            </div>
        );
    }

    const isNotPaid = ui === "not_paid";
    const title = isNotPaid ? t("notPaidTitle") : ui === "no_reference" ? t("noReferenceTitle") : t("verifyErrorTitle");
    const message = isNotPaid
        ? t("notPaidMessage")
        : ui === "no_reference"
          ? t("noReferenceMessage")
          : t("verifyErrorMessage");

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-warning-600">
                            {ui === "no_reference" ? "info" : "error"}
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{message}</p>
                    {isNotPaid && releasedPlatformAttempt ? (
                        <p className="text-sm text-slate-700 dark:text-slate-300 pt-2">{t("notPaidPlatformReleased")}</p>
                    ) : null}
                </div>

                <div className="pt-4">
                    <Link href={backHref}>
                        <Button variant="secondary" className="w-full">
                            {scope === "platform" ? t("backToSubscription") : t("backToInvoices")}
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}

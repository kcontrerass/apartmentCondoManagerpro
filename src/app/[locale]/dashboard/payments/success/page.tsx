import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { recurrente } from "@/lib/recurrente";
import { prisma } from "@/lib/db";
import { getPlatformRecurrenteKeys } from "@/lib/platform-billing";
import { fulfillPlatformFeePayment } from "@/lib/platform-fee-fulfill";
import {
    getRecurrenteCheckoutMetadata,
    isRecurrenteCheckoutPaid,
} from "@/lib/recurrente-checkout-paid";
import { InvoiceCategory } from "@prisma/client";

interface Props {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{
        session_id?: string;
        checkout_session_id?: string;
        id?: string;
        scope?: string;
    }>;
}

export default async function PaymentSuccessPage({ params, searchParams }: Props) {
    const { locale } = await params;
    const sp = await searchParams;
    const session_id =
        sp.session_id ?? sp.checkout_session_id ?? sp.id;
    const scope = sp.scope;
    const t = await getTranslations({ locale, namespace: 'Payments.success' });

    // Verify session via Session ID (Preferred/Secure)
    if (session_id) {
        try {
            const platformKeys = scope === "platform" ? await getPlatformRecurrenteKeys() : null;
            const checkout = await recurrente.checkouts.retrieve(
                session_id,
                platformKeys || undefined
            );

            if (checkout) {
                const metadata = getRecurrenteCheckoutMetadata(checkout);
                const type = metadata.type;
                const isPaid = isRecurrenteCheckoutPaid(checkout);

                if (isPaid && scope === "platform") {
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

                if (isPaid && scope !== "platform") {
                    // --- CASE 1: RESERVATION PAYMENT ---
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
                    }
                    // --- CASE 2: EXISTING INVOICE PAYMENT ---
                    else {
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
        } catch (error) {
            console.error("Error verifying payment session:", error);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-success-600">check_circle</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {t('title')}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        {t('message')}
                    </p>
                </div>

                <div className="pt-4">
                    <Link href={scope === "platform" ? "/dashboard/platform-subscription" : "/dashboard/invoices"}>
                        <Button variant="primary" className="w-full">
                            {scope === "platform" ? t("backToSubscription") : t("backToInvoices")}
                        </Button>
                    </Link>
                </div>

                <p className="text-xs text-slate-500">
                    {t('note')}
                </p>
            </Card>
        </div>
    );
}

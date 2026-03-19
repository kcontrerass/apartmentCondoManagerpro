import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { recurrente } from "@/lib/recurrente";
import { prisma } from "@/lib/db";

interface Props {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ session_id?: string }>;
}

export default async function PaymentSuccessPage({ params, searchParams }: Props) {
    const { locale } = await params;
    const { session_id } = await searchParams;
    const t = await getTranslations({ locale, namespace: 'Payments.success' });

    // Verify session via Session ID (Preferred/Secure)
    if (session_id) {
        try {
            const checkout = await recurrente.checkouts.retrieve(session_id);

            if (checkout) {
                const metadata = checkout.metadata || checkout.checkout?.metadata || {};
                const type = metadata.type;
                const status = checkout.status || checkout.payment_status || checkout.checkout?.status;
                const isPaid = status === 'paid' || status === 'completed' || status === 'succeeded';

                if (isPaid) {
                    // --- CASE 1: RESERVATION PAYMENT ---
                    if (type === 'RESERVATION') {
                        const { amenityId, startTime, endTime, notes, userId, totalAmount } = metadata;

                        // Check if reservation already exists to avoid duplicates on refresh
                        const existingRes = await (prisma as any).reservation.findFirst({
                            where: {
                                userId,
                                amenityId,
                                startTime: new Date(startTime),
                                endTime: new Date(endTime)
                            }
                        });

                        if (!existingRes) {
                            // 1. Get user for the invoice
                            const user = await prisma.user.findUnique({
                                where: { id: userId },
                                include: { residentProfile: true }
                            });

                            // 2. Create Invoice first
                            const invoice = await (prisma as any).invoice.create({
                                data: {
                                    unitId: user?.residentProfile?.unitId,
                                    month: new Date(startTime).getUTCMonth() + 1,
                                    year: new Date(startTime).getUTCFullYear(),
                                    totalAmount: Number(totalAmount),
                                    status: 'PAID',
                                    paymentMethod: 'CARD',
                                    type: 'SERVICE', // or a specific type if available
                                    description: `Reserva de amenidad (Pagado vía Tarjeta)`
                                }
                            });

                            // 3. Create Reservation
                            await (prisma as any).reservation.create({
                                data: {
                                    userId,
                                    amenityId,
                                    startTime: new Date(startTime),
                                    endTime: new Date(endTime),
                                    notes,
                                    status: 'APPROVED',
                                    invoiceId: invoice.id
                                }
                            });
                            console.log(`Reservation created for user ${userId} after successful payment.`);
                        }
                    }
                    // --- CASE 2: EXISTING INVOICE PAYMENT ---
                    else {
                        const invoiceId = metadata.invoiceId;
                        if (invoiceId) {
                            await prisma.invoice.updateMany({
                                where: {
                                    id: invoiceId,
                                    status: { not: "PAID" },
                                },
                                data: {
                                    status: "PAID",
                                    paymentMethod: "CARD",
                                    updatedAt: new Date(),
                                }
                            });

                            const linkedReservation = await (prisma as any).reservation.findUnique({
                                where: { invoiceId }
                            });

                            if (linkedReservation) {
                                await (prisma as any).reservation.update({
                                    where: { id: linkedReservation.id },
                                    data: { status: 'APPROVED' }
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
                    <Link href="/dashboard/invoices">
                        <Button variant="primary" className="w-full">
                            {t('backToInvoices')}
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

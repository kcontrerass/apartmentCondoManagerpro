import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

interface Props {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ session_id?: string }>;
}

export default async function PaymentSuccessPage({ params, searchParams }: Props) {
    const { session_id } = await searchParams;
    const t = await getTranslations('Payments.success');

    // Verify session and update status immediately for better UX
    if (session_id) {
        try {
            const session = await stripe.checkout.sessions.retrieve(session_id);
            const invoiceId = session.metadata?.invoiceId;

            if (session.payment_status === 'paid' && invoiceId) {
                await (prisma as any).invoice.update({
                    where: { id: invoiceId },
                    data: {
                        status: "PAID",
                        updatedAt: new Date(),
                    }
                });
                console.log(`Invoice ${invoiceId} updated via success page redirect`);
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

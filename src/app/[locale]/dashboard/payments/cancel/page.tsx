import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Role } from "@/types/roles";
import { PlatformFeePaymentMethod, PlatformFeeStatus } from "@prisma/client";
import { findComplexForPlatformFeeByUser } from "@/lib/find-admin-complex-platform-fee";

export default async function PaymentCancelPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ scope?: string; platformFeePaymentId?: string }>;
}) {
    const { locale } = await params;
    const sp = await searchParams;
    const t = await getTranslations({ locale, namespace: "Payments.cancel" });
    const session = await auth();

    let releasedCheckout = false;

    if (
        sp.scope === "platform" &&
        sp.platformFeePaymentId &&
        session?.user &&
        (session.user.role === Role.ADMIN || session.user.role === Role.BOARD_OF_DIRECTORS)
    ) {
        const complex = await findComplexForPlatformFeeByUser(session.user.id, session.user.role);
        const payment = await prisma.platformFeePayment.findUnique({
            where: { id: sp.platformFeePaymentId },
        });
        if (
            complex &&
            payment &&
            payment.complexId === complex.id &&
            payment.status === PlatformFeeStatus.PENDING &&
            payment.paymentMethod === PlatformFeePaymentMethod.CARD
        ) {
            await prisma.platformFeePayment.update({
                where: { id: payment.id },
                data: { status: PlatformFeeStatus.CANCELLED },
            });
            releasedCheckout = true;
        }
    }

    const isPlatform = sp.scope === "platform";
    const backHref = isPlatform ? "/dashboard/platform-subscription" : "/dashboard/invoices";
    const backLabel = isPlatform ? t("backToSubscription") : t("backToInvoices");

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-warning-600">error</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t("title")}</h1>
                    <p className="text-slate-600 dark:text-slate-400">{t("message")}</p>
                    {releasedCheckout ? (
                        <p className="text-sm text-slate-700 dark:text-slate-300 pt-2">{t("platformReleased")}</p>
                    ) : null}
                </div>

                <div className="pt-4">
                    <Link href={backHref}>
                        <Button variant="secondary" className="w-full">
                            {backLabel}
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}

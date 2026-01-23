import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function PaymentCancelPage() {
    const t = useTranslations('Payments.cancel');

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
            <Card className="max-w-md w-full p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-warning-600">error</span>
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
                        <Button variant="secondary" className="w-full">
                            {t('backToInvoices')}
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}

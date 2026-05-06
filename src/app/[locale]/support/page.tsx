import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { auth } from '@/auth';
import { getPublicSupportEmail } from '@/lib/public-support-email';
import { canAccessSupport } from '@/lib/support-access';

type Props = { params: Promise<{ locale: string }> };

export default async function SupportPage({ params }: Props) {
    const { locale } = await params;
    const session = await auth();

    if (!session?.user) {
        redirect(`/${locale}/login`);
    }
    if (!canAccessSupport(session.user.role)) {
        redirect(`/${locale}/dashboard`);
    }

    const t = await getTranslations({ locale, namespace: 'SupportPage' });
    const supportEmail = getPublicSupportEmail();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100">
            <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
                <nav>
                    <Link
                        href="/dashboard"
                        className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        {t('backToDashboard')}
                    </Link>
                </nav>

                <header className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t('intro')}</p>
                </header>

                {supportEmail ? (
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800/40 p-6 space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t('emailIntro')}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <a
                                href={`mailto:${supportEmail}`}
                                className="inline-flex justify-center items-center px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity"
                            >
                                {t('emailCta')}
                            </a>
                            <span className="font-mono text-sm text-slate-700 dark:text-slate-300 break-all">{supportEmail}</span>
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 p-5 text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                        {t('noPublicEmail')}
                    </div>
                )}
            </div>
        </div>
    );
}

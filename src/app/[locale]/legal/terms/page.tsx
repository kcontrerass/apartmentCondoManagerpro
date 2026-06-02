import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { SOFTWARE_TERMS_AND_PRIVACY_VERSION } from '@/lib/software-terms';
import { SoftwareTermsBody } from '@/components/legal/SoftwareTermsBody';
import { prisma } from '@/lib/db';

type Props = { params: Promise<{ locale: string }> };

/**
 * Misma versión legal que `/legal/software-terms`; navegación pensada para flujo de suscripción de plataforma.
 */
export default async function LegalTermsPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SoftwareTerms' });
    const tSub = await getTranslations({ locale, namespace: 'PlatformLegalDocs' });

    const settings = await (prisma as any).platformRecurrenteSettings.findUnique({
        where: { id: 'default' },
        select: { termsBody: true }
    });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100">
            <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
                <nav className="flex flex-wrap gap-4 text-sm font-medium">
                    <Link
                        href={`/${locale}/dashboard/platform-subscription`}
                        className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        {tSub('backToSubscription')}
                    </Link>
                    <Link href={`/${locale}/login`} className="text-slate-500 dark:text-slate-400 hover:text-primary hover:underline">
                        {t('backToLogin')}
                    </Link>
                </nav>

                <SoftwareTermsBody
                    pageTitle={t('pageTitle')}
                    versionLine={t('version', { version: SOFTWARE_TERMS_AND_PRIVACY_VERSION })}
                    langNotice={locale === 'en' ? t('langNotice') : null}
                    customTerms={settings?.termsBody}
                />
            </div>
        </div>
    );
}

import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SOFTWARE_TERMS_AND_PRIVACY_VERSION } from '@/lib/software-terms';
import { SoftwareTermsBody } from '@/components/legal/SoftwareTermsBody';

type Props = { params: Promise<{ locale: string }> };

export default async function SoftwareTermsPage({ params }: Props) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'SoftwareTerms' });

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100">
            <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
                <nav className="flex flex-wrap gap-4 text-sm font-medium">
                    <Link href="/register" className="text-primary hover:underline inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                        {t('backToRegister')}
                    </Link>
                    <Link href="/login" className="text-slate-500 dark:text-slate-400 hover:text-primary hover:underline">
                        {t('backToLogin')}
                    </Link>
                </nav>

                <SoftwareTermsBody
                    pageTitle={t('pageTitle')}
                    versionLine={t('version', { version: SOFTWARE_TERMS_AND_PRIVACY_VERSION })}
                    langNotice={locale === 'en' ? t('langNotice') : null}
                />
            </div>
        </div>
    );
}

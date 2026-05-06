import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

type FooterProps = {
    /** Solo administradores de complejo, junta directiva y súper administrador de plataforma */
    showSupport?: boolean;
};

export async function Footer({ showSupport = false }: FooterProps) {
    const t = await getTranslations('Common');
    const year = new Date().getFullYear();

    return (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark py-4 px-6">
            <div
                className={
                    showSupport
                        ? 'flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400'
                        : 'flex flex-col md:flex-row justify-center md:justify-start items-center gap-4 text-sm text-slate-500 dark:text-slate-400'
                }
            >
                <p>{t('footerCopyright', { year })}</p>
                {showSupport ? (
                    <Link href="/support" className="hover:text-primary transition-colors font-medium">
                        {t('support')}
                    </Link>
                ) : null}
            </div>
        </footer>
    );
}

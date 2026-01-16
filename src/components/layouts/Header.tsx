"use client";

import { Button } from "@/components/ui/Button";
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

export function Header() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('Common');

    const toggleLanguage = () => {
        const nextLocale = locale === 'es' ? 'en' : 'es';
        router.replace(pathname, { locale: nextLocale });
    };

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-all duration-300">
            {/* Breadcrumbs */}
            <div className="flex-1 lg:flex-none">
                <Breadcrumbs />
            </div>

            {/* Search Bar - Hide on small mobile, show expand button or make smaller */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
                <div className="relative group">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-slate-400 text-[20px] group-focus-within:text-primary transition-colors">search</span>
                    </span>
                    <input
                        type="search"
                        placeholder={t('search')}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 md:gap-2">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 md:hidden">
                    <span className="material-symbols-outlined">search</span>
                </Button>

                {/* Language Switcher */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-2 text-slate-500 hover:text-primary transition-colors font-medium border border-slate-200 dark:border-slate-700 rounded-lg hover:border-primary/30"
                >
                    <span className="material-symbols-outlined text-[18px]">language</span>
                    <span className="uppercase text-xs">{locale === 'es' ? 'EN' : 'ES'}</span>
                </Button>

                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 relative">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 hidden sm:flex">
                    <span className="material-symbols-outlined">help</span>
                </Button>

            </div>
        </header>
    );
}

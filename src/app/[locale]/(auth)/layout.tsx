'use client';

import Image from 'next/image';
import { useTheme } from "@/components/providers/ThemeProvider";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const t = useTranslations("Auth");
    const { theme, toggleTheme } = useTheme();
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleLanguage = () => {
        const nextLocale = locale === 'es' ? 'en' : 'es';
        router.replace(pathname, { locale: nextLocale });
    };

    return (
        <div className="relative min-h-screen pt-10 flex flex-col items-center justify-center bg-[#FDFDFD] dark:bg-slate-950 font-sans selection:bg-primary/20 transition-colors duration-500">
            {/* Subtle Texture Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
            </div>

            {/* Top Bar Controls */}
            <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
                {/* Theme Toggle */}
                {mounted && (
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-500 hover:text-primary transition-all duration-300 shadow-sm"
                        title={theme === 'dark' ? t("loginInstructions") : t("loginInstructions")}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                        </span>
                    </button>
                )}

                {/* Language Switcher */}
                <button
                    onClick={toggleLanguage}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-500 hover:text-primary transition-all duration-300 shadow-sm font-bold text-xs uppercase tracking-wider"
                >
                    <span className="material-symbols-outlined text-[18px]">language</span>
                    {locale === 'es' ? 'EN' : 'ES'}
                </button>
            </div>

            <main className="relative z-10 w-full max-w-[440px] px-6">
                {/* Branding - Clean & Centered */}
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 mb-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm text-primary transition-all duration-300">
                        <span className="material-symbols-outlined text-[28px]">apartment</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase transition-all duration-300">
                        ADESSO<span className="text-primary">-</span>365
                    </h1>
                </div>

                {/* Main Auth Container */}
                <div className="bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-[32px] p-8 sm:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-500">
                    {children}
                </div>

                {/* Footer Copy */}
                <div className="mt-12 text-center text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 space-y-2">
                    <p>
                        © {new Date().getFullYear()} ADESSO-365 • PropTech Solutions
                    </p>
                    <p className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                        {t("authorizedPoint")}
                    </p>
                </div>
            </main>

            {/* Subtle help corner text */}

        </div>
    );
}



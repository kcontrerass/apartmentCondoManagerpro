'use client';

import { useTheme } from "@/components/providers/ThemeProvider";
import { getAuthHeroImageUrl } from "@/lib/auth-hero";
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';

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
        <div className="min-h-screen flex font-sans selection:bg-primary/20 transition-colors duration-500 bg-[#FDFDFD] dark:bg-slate-950">
            <Toaster position="top-center" richColors closeButton />
            {/* Left Panel - Hero/Image */}
            <div className="hidden lg:flex relative w-[45%] xl:w-1/2 bg-slate-900 overflow-hidden items-end">
                {/* Hero: condominio / edificio residencial (sustituir vía NEXT_PUBLIC_AUTH_HERO_IMAGE_URL o landing) */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-[2s] hover:scale-105 opacity-55 mix-blend-luminosity"
                    style={{ backgroundImage: `url('${getAuthHeroImageUrl()}')` }}
                />
                
                {/* Gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                {/* Hero Content */}
                <motion.div 
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative z-10 p-12 lg:p-16 xl:p-24 pb-20 w-full"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-8 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl text-white shadow-2xl">
                        <span className="material-symbols-outlined text-[32px]">domain</span>
                    </div>
                    
                    <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white uppercase mb-4 leading-tight drop-shadow-lg">
                        ADESSO<span className="text-primary">-</span>365
                    </h1>
                    
                    <div className="w-12 h-1.5 bg-primary rounded-full mb-6" />

                    <p className="text-lg xl:text-xl font-medium text-slate-300 leading-relaxed max-w-md drop-shadow">
                        {t("tagline")}
                    </p>
                    <p className="mt-4 text-sm text-slate-400/90 leading-relaxed max-w-md drop-shadow">
                        {t("heroCaption")}
                    </p>
                </motion.div>
            </div>

            {/* Right Panel - Auth Controls & Form */}
            <div className="flex flex-col flex-1 relative w-full lg:w-[55%] xl:w-1/2">
                
                {/* Subtle Texture Background */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04]">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
                </div>

                {/* Top Bar Controls */}
                <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-50 flex items-center gap-3">
                    {mounted && (
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 text-slate-500 hover:text-primary transition-all duration-300 shadow-sm"
                            title={theme === 'dark' ? t("loginInstructions") : t("loginInstructions")}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>
                    )}
                    <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/5 text-slate-500 hover:text-primary transition-all duration-300 shadow-sm font-bold text-xs uppercase tracking-wider"
                    >
                        <span className="material-symbols-outlined text-[18px]">language</span>
                        {locale === 'es' ? 'EN' : 'ES'}
                    </button>
                </div>

                {/* Form Container */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
                    <main className="relative z-10 w-full max-w-[420px]">
                        
                        {/* Mobile Branding (Only visible on small screens) */}
                        <div className="lg:hidden mb-10 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 mb-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl shadow-md text-primary">
                                <span className="material-symbols-outlined text-[28px]">domain</span>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase mb-2">
                                ADESSO<span className="text-primary">-</span>365
                            </h1>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                {t("tagline")}
                            </p>
                        </div>

                        {/* Main Auth Container */}
                        <div className="bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/5 rounded-[32px] p-8 sm:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-500">
                            {children}
                        </div>

                        {/* Footer Copy */}
                        <div className="mt-12 text-center text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 space-y-2">
                            <p>© {new Date().getFullYear()} ADESSO-365 • PropTech Solutions</p>
                            <p className="flex items-center justify-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                {t("authorizedPoint")}
                            </p>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}



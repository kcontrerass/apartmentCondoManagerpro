'use client';

import { useActionState } from 'react';
import { authenticate } from '@/lib/actions/auth-actions';
import { Link } from '@/i18n/routing';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function LoginPage() {
    const t = useTranslations("Auth");
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
            <div className="mb-10">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {t("welcomeBack")}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-[14px]">
                    {t("loginInstructions")}
                </p>
            </div>

            <form action={formAction} className="space-y-6">
                <div className="space-y-1.5">
                    <label
                        htmlFor="email"
                        className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-0.5"
                    >
                        {t("email")}
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-white/5 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 text-slate-900 dark:text-white transition-all duration-200"
                        placeholder={t("emailPlaceholder")}
                    />
                </div>

                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor="password"
                            className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 ml-0.5"
                        >
                            {t("password")}
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-[11px] font-black uppercase tracking-wider text-slate-400 hover:text-primary transition-colors duration-200"
                        >
                            {t("forgotPassword")}
                        </Link>
                    </div>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-white/5 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 text-slate-900 dark:text-white transition-all duration-200"
                        placeholder={t("passwordPlaceholder")}
                    />
                </div>

                <div className="flex items-center pt-1">
                    <input
                        id="remember_me"
                        name="remember_me"
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 text-primary focus:ring-primary/40 bg-white dark:bg-slate-900 transition-all cursor-pointer"
                    />
                    <label
                        htmlFor="remember_me"
                        className="ml-3 block text-sm text-slate-500 dark:text-slate-400 cursor-pointer select-none font-medium"
                    >
                        {t("rememberMe")}
                    </label>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="flex w-full justify-center items-center rounded-xl bg-slate-900 dark:bg-primary px-6 py-4 text-xs font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-slate-200 dark:shadow-none hover:bg-slate-800 dark:hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-[0.98]"
                    >
                        {isPending ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[18px] mr-2">progress_activity</span>
                                {t("verifying")}
                            </>
                        ) : t("continueButton")}
                    </button>
                </div>

                <div className="pt-8 border-t border-slate-50 dark:border-white/5">
                    <p className="text-center text-xs text-slate-400 font-medium">
                        {t("newUser")}{' '}
                        <Link
                            href="/register"
                            className="font-black text-slate-900 dark:text-primary hover:underline underline-offset-4 decoration-primary/30 ml-1 transition-all"
                        >
                            {t("registerNow")}
                        </Link>
                    </p>
                </div>

                <div
                    className="flex h-6 items-center justify-center pt-2"
                    aria-live="polite"
                    aria-atomic="true"
                >
                    {errorMessage && (
                        <p className="text-[11px] font-black text-red-500 uppercase tracking-wider bg-red-50 dark:bg-red-900/10 px-3 py-1 rounded-full">
                            {errorMessage}
                        </p>
                    )}
                </div>
            </form>
        </motion.div>
    );
}




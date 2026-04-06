"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
    const t = useTranslations("ForgotPassword");
    const [showAdminMessage, setShowAdminMessage] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-8"
        >
            <div className="text-left">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {t("title")}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-[14px] leading-relaxed">
                    {t("intro")}
                </p>
            </div>

            {showAdminMessage && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6 text-left dark:border-amber-900/20 dark:bg-amber-900/10 backdrop-blur-sm"
                    role="status"
                >
                    <p className="text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-400 mb-2">
                        {t("adminTitle")}
                    </p>
                    <p className="text-sm text-amber-900/80 dark:text-amber-200/80 leading-relaxed font-medium">
                        {t("adminBody")}
                    </p>
                </motion.div>
            )}

            <button
                type="button"
                onClick={() => setShowAdminMessage(true)}
                className="flex w-full justify-center items-center rounded-xl bg-slate-900 dark:bg-primary px-6 py-4 text-xs font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-slate-200 dark:shadow-none hover:bg-slate-800 dark:hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 active:scale-[0.98]"
            >
                {t("showInstructions")}
            </button>

            <div className="pt-8 border-t border-slate-50 dark:border-white/5 text-center">
                <Link
                    href="/login"
                    className="text-xs font-black uppercase tracking-wider text-slate-400 hover:text-slate-900 dark:hover:text-primary transition-all duration-200"
                >
                    ← {t("backToLogin")}
                </Link>
            </div>
        </motion.div>
    );
}


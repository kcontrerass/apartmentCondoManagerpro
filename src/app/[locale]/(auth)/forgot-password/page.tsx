"use client";

import { useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
    const t = useTranslations("ForgotPassword");
    const [showAdminMessage, setShowAdminMessage] = useState(false);

    return (
        <div className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {t("title")}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("intro")}</p>
            </div>

            {showAdminMessage && (
                <div
                    className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-900/50 dark:bg-amber-950/30"
                    role="status"
                >
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{t("adminTitle")}</p>
                    <p className="mt-2 text-sm text-amber-900/90 dark:text-amber-100/90">{t("adminBody")}</p>
                </div>
            )}

            <button
                type="button"
                onClick={() => setShowAdminMessage(true)}
                className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200"
            >
                {t("showInstructions")}
            </button>

            <div className="text-center">
                <Link
                    href="/login"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    {t("backToLogin")}
                </Link>
            </div>
        </div>
    );
}

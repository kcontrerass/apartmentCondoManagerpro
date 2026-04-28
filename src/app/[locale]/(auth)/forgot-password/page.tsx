"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { requestPasswordResetAction } from "@/lib/actions/auth-actions";
import { AuthRecaptcha, isRecaptchaWidgetEnabled } from "@/components/auth/AuthRecaptcha";
import { cn } from "@/lib/utils";

type ForgotMessageKey =
    | "checkEmail"
    | "smtpNotConfigured"
    | "emailSendFailed"
    | "missingEmail"
    | "emailInvalid"
    | "captchaRequired"
    | "captchaFailed";

export default function ForgotPasswordPage() {
    const t = useTranslations("ForgotPassword");
    const locale = useLocale();
    const [state, formAction, isPending] = useActionState(
        requestPasswordResetAction,
        undefined
    );
    const [captchaNonce, setCaptchaNonce] = useState(0);
    const [captchaReady, setCaptchaReady] = useState(() => !isRecaptchaWidgetEnabled());
    const prevPending = useRef(isPending);

    useEffect(() => {
        if (prevPending.current && !isPending) {
            setCaptchaNonce((n) => n + 1);
        }
        prevPending.current = isPending;
    }, [isPending]);

    const onCaptchaToken = useCallback((token: string) => {
        setCaptchaReady(Boolean(token));
    }, []);

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
                <p
                    className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.06] dark:bg-primary/10 dark:border-primary/30 px-4 py-3 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300"
                    role="note"
                >
                    {t("spamHint")}
                </p>
            </div>

            <form action={formAction} className="space-y-6">
                <input type="hidden" name="locale" value={locale} />

                {state?.messageKey && (
                    <div
                        className={cn(
                            "rounded-xl p-4 text-sm font-medium",
                            state.success
                                ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                                : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                        )}
                        role="status"
                    >
                        {t(state.messageKey as ForgotMessageKey)}
                    </div>
                )}

                <div>
                    <label
                        htmlFor="forgot-email"
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                    >
                        {t("emailLabel")}
                    </label>
                    <input
                        id="forgot-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        disabled={isPending}
                        placeholder={t("emailPlaceholder")}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-slate-900 dark:text-white disabled:opacity-60"
                    />
                </div>

                <AuthRecaptcha resetSignal={captchaNonce} onTokenChange={onCaptchaToken} />

                <button
                    type="submit"
                    disabled={isPending || !captchaReady}
                    className="flex w-full justify-center items-center rounded-xl bg-slate-900 dark:bg-primary px-6 py-4 text-xs font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-slate-200 dark:shadow-none hover:bg-slate-800 dark:hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                >
                    {isPending ? t("submitting") : t("submit")}
                </button>
            </form>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 text-left dark:border-white/5 dark:bg-white/[0.02]">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                    {t("adminTitle")}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {t("adminBody")}
                </p>
            </div>

            <div className="pt-2 border-t border-slate-50 dark:border-white/5 text-center">
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

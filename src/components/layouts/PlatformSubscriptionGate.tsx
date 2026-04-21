"use client";

import { ReactNode } from "react";
import { usePathname } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { Role } from "@/types/roles";
import { Card } from "@/components/ui/Card";
import {
    canPayPlatformSubscriptionRole,
    isDashboardPathExemptWhenPlatformDelinquent,
} from "@/lib/platform-subscription-rules";
import { useTranslations } from "next-intl";

export function PlatformSubscriptionGate({
    children,
    blocked,
    userRole,
}: {
    children: ReactNode;
    blocked: boolean;
    userRole?: string;
}) {
    const pathname = usePathname() ?? "";
    const t = useTranslations("PlatformSubscriptionGate");

    if (!userRole || userRole === Role.SUPER_ADMIN || !blocked) {
        return <>{children}</>;
    }

    if (isDashboardPathExemptWhenPlatformDelinquent(pathname, userRole)) {
        return <>{children}</>;
    }

    const canPay = canPayPlatformSubscriptionRole(userRole);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in duration-300 px-4">
            <Card className="p-8 max-w-md bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-3xl">payments</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{t("title")}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                    {canPay ? t("descriptionPayers") : t("descriptionOthers")}
                </p>
                {canPay ? (
                    <Link
                        href="/dashboard/platform-subscription"
                        className="inline-flex w-full min-h-[44px] items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-dark transition-colors"
                    >
                        {t("ctaPay")}
                    </Link>
                ) : null}
            </Card>
        </div>
    );
}

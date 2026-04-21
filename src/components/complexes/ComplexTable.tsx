"use client";

import { ComplexType } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Role } from "@/types/roles";
import type { ComplexWithCount } from "@/hooks/useComplexes";

interface ComplexTableProps {
    complexes: ComplexWithCount[];
    onDelete?: (id: string) => void;
    userRole?: string;
    extendingSubscriptionId?: string | null;
    onReactivateSubscription?: (complex: ComplexWithCount) => void;
}

export function ComplexTable({
    complexes,
    onDelete,
    userRole,
    extendingSubscriptionId,
    onReactivateSubscription,
}: ComplexTableProps) {
    const t = useTranslations("Complexes");
    const isSuperAdmin = userRole === Role.SUPER_ADMIN;

    const getTypeBadgeVariant = (type: ComplexType) => {
        switch (type) {
            case ComplexType.BUILDING:
                return "info";
            case ComplexType.RESIDENTIAL:
                return "success";
            case ComplexType.CONDO:
                return "warning";
            case ComplexType.SHOPPING_CENTER:
                return "neutral";
            default:
                return "neutral";
        }
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-background-dark/50 text-slate-500 dark:text-slate-400 font-medium uppercase text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">{t("name")}</th>
                        <th className="px-6 py-4">{t("type")}</th>
                        <th className="px-6 py-4">{t("address")}</th>
                        <th className="px-6 py-4 text-center">{t("units")}</th>
                        <th className="px-6 py-4 text-center">{t("amenities")}</th>
                        <th className="px-6 py-4 text-right">{t("actions")}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {complexes.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                                {t("noComplexesFound")}
                            </td>
                        </tr>
                    ) : (
                        complexes.map((complex) => (
                            <tr key={complex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                                    <div className="flex items-center gap-3">
                                        {complex.logoUrl ? (
                                            <img src={complex.logoUrl} alt={complex.name} className="w-8 h-8 rounded object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-slate-100 dark:bg-background-dark flex items-center justify-center text-slate-400">
                                                <span className="material-symbols-outlined text-lg">apartment</span>
                                            </div>
                                        )}
                                        {complex.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant={getTypeBadgeVariant(complex.type)}>
                                        {t(`types.${complex.type}` as never)}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                    {complex.address}
                                </td>
                                <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">
                                    {complex._count?.units || 0}
                                </td>
                                <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">
                                    {complex._count?.amenities || 0}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        {isSuperAdmin &&
                                        complex.platformSubscriptionPastDue &&
                                        onReactivateSubscription ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="border-amber-400 text-amber-900 dark:text-amber-200 dark:border-amber-700"
                                                disabled={extendingSubscriptionId === complex.id}
                                                onClick={() => onReactivateSubscription(complex)}
                                            >
                                                {extendingSubscriptionId === complex.id ? (
                                                    <span className="material-symbols-outlined animate-spin text-base">
                                                        progress_activity
                                                    </span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-base">
                                                        published_with_changes
                                                    </span>
                                                )}
                                                <span className="ml-1">{t("reactivateSubscription")}</span>
                                            </Button>
                                        ) : null}
                                        <Link href={`/dashboard/complexes/${complex.id}`}>
                                            <Button variant="secondary" size="sm">{t("view")}</Button>
                                        </Link>
                                        {isSuperAdmin && (
                                            <>
                                                <Link href={`/dashboard/complexes/${complex.id}/edit`}>
                                                    <Button variant="secondary" size="sm">{t("edit")}</Button>
                                                </Link>
                                                {onDelete && (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => onDelete(complex.id)}
                                                    >
                                                        {t("delete")}
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Unit, Resident } from "@prisma/client";
import { Role } from "@/types/roles";
import { useTranslations } from "next-intl";

interface UnitWithResidents extends Unit {
    residents: (Resident & { user: { name: string; email: string } })[];
    complex?: { name: string };
}

interface UnitTableProps {
    units: UnitWithResidents[];
    /** True when the list was filtered and some units exist but none match the search. */
    hasUnfilteredUnits?: boolean;
    searchQuery?: string;
    userRole?: Role;
    onEdit?: (unit: UnitWithResidents) => void;
    onDelete?: (unitId: string) => void;
    onView?: (unitId: string) => void;
}

export function UnitTable({
    units,
    hasUnfilteredUnits,
    searchQuery,
    userRole,
    onEdit,
    onDelete,
    onView,
}: UnitTableProps) {
    const t = useTranslations("Units");
    const tCommon = useTranslations("Common");

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t("number")}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t("complex")}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t("type")}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t("capacity")}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t("status")}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t("mainResident")}</th>
                        <th className="py-4 px-4 text-right text-sm font-semibold text-slate-900 dark:text-white">{tCommon("actions")}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {units.map((unit) => (
                        <tr key={unit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-4">
                                <span
                                    className="font-medium text-slate-900 dark:text-white"
                                    style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: 'normal' }}
                                >
                                    {unit.number}
                                </span>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {unit.complex?.name || t("notAvailable")}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {unit.type || t("notAvailable")}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {t("capacityFormat", { bedrooms: unit.bedrooms, bathrooms: unit.bathrooms })}
                            </td>
                            <td className="py-4 px-4">
                                <Badge
                                    variant={
                                        unit.status === 'OCCUPIED' ? 'success' :
                                            unit.status === 'MAINTENANCE' ? 'warning' : 'neutral'
                                    }
                                >
                                    {unit.status === 'OCCUPIED' ? t('occupied') :
                                        unit.status === 'MAINTENANCE' ? t('maintenance') : t('vacant')}
                                </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {unit.residents[0]?.user.name || t("noResident")}
                            </td>
                            <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => onView?.(unit.id)}
                                        title={tCommon("view")}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                    </Button>

                                    {(userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => onEdit?.(unit)}
                                                title={tCommon("edit")}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => onDelete?.(unit.id)}
                                                title={tCommon("delete")}
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {units.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-500">
                        {hasUnfilteredUnits && searchQuery?.trim()
                            ? t("searchNoResults")
                            : t("noUnitsFound")}
                    </p>
                </div>
            )}
        </div>
    );
}

"use client";

import { Button } from "@/components/ui/Button";
import { Resident, Unit } from "@prisma/client";
import { Role } from "@/types/roles";
import { useTranslations } from "next-intl";

interface ResidentWithExtras extends Resident {
    user: {
        name: string;
        email: string;
        phone: string | null;
    };
    unit: Unit & {
        complex: {
            name: string;
        };
    };
}

interface ResidentTableProps {
    residents: ResidentWithExtras[];
    userRole?: Role;
    onEdit?: (resident: ResidentWithExtras) => void;
    onDelete?: (residentId: string) => void;
    onView?: (residentId: string) => void;
}

export function ResidentTable({ residents, userRole, onEdit, onDelete, onView }: ResidentTableProps) {
    const t = useTranslations("Residents");
    const tCommon = useTranslations("Common");

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t("name")}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t("unit")}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t("since")}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t("emergencyContact")}</th>
                        <th className="py-4 px-4 text-right text-sm font-semibold text-slate-900 dark:text-white">{tCommon("actions")}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {residents.map((resident) => {
                        const emergency = resident.emergencyContact as { name?: string; phone?: string } | null;
                        return (
                            <tr key={resident.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="py-4 px-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900 dark:text-white">{resident.user.name}</span>
                                        <span className="text-xs text-slate-500">{resident.user.email}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                                            {t("unitLabel", { number: resident.unit.number })}
                                        </span>
                                        <span className="text-xs text-slate-500">{resident.unit.complex.name}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                    {new Date(resident.startDate).toLocaleDateString()}
                                </td>
                                <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                    {emergency?.name ? (
                                        <div className="flex flex-col">
                                            <span>{emergency.name}</span>
                                            <span className="text-xs">{emergency.phone}</span>
                                        </div>
                                    ) : "—"}
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => onView?.(resident.id)} title={tCommon("view")}>
                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                        </Button>

                                        {(userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) && (
                                            <>
                                                <Button variant="secondary" size="sm" onClick={() => onEdit?.(resident)} title={tCommon("edit")}>
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => onDelete?.(resident.id)} title={tCommon("delete")}>
                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {residents.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-500">{t("noResidentsFound")}</p>
                </div>
            )}
        </div>
    );
}

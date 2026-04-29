"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { Role } from "@/types/roles";
import { useTranslations } from "next-intl";

interface ServiceWithCount {
    id: string;
    name: string;
    description: string | null;
    basePrice: any;
    frequency: string;
    /** Cantidad por defecto al contratar (servicios con cantidad). */
    defaultQuantity?: number | null;
    complexId: string;
    complex?: { name: string };
    _count: {
        unitServices: number;
    };
    unitServices?: { id: string, status: string, quantity: number, startDate: string | Date }[];
    isRequired?: boolean;
    hasQuantity?: boolean;
}

interface ServiceTableProps {
    services: ServiceWithCount[];
    userRole?: Role;
    onEdit?: (service: ServiceWithCount) => void;
    onDelete?: (serviceId: string) => void;
    onSubscribe?: (service: ServiceWithCount, quantity: number) => void;
    onUpdateQuantity?: (unitServiceId: string, quantity: number) => void;
    onUnsubscribe?: (unitServiceId: string) => void;
    isSubmitting?: string | null;
}

const FREQUENCY_KEYS: Record<string, "frequencyOnce" | "frequencyDaily" | "frequencyWeekly" | "frequencyMonthly" | "frequencyYearly"> = {
    ONCE: "frequencyOnce",
    DAILY: "frequencyDaily",
    WEEKLY: "frequencyWeekly",
    MONTHLY: "frequencyMonthly",
    YEARLY: "frequencyYearly",
};

export function ServiceTable({
    services,
    userRole,
    onEdit,
    onDelete,
    onSubscribe,
    onUpdateQuantity,
    onUnsubscribe,
    isSubmitting
}: ServiceTableProps) {
    const t = useTranslations("Services");
    const tCommon = useTranslations("Common");

    const frequencyLabel = (freq: string) => {
        const key = FREQUENCY_KEYS[freq];
        return key ? t(key) : freq;
    };

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {t("name")}
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {t("complex")}
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {t("basePrice")}
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {t("frequency")}
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            {t("assignedUnits")}
                        </th>
                        {userRole === Role.RESIDENT && (
                            <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                                {t("quantity")}
                            </th>
                        )}
                        {userRole === Role.RESIDENT && (
                            <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                                {t("startDateColumn")}
                            </th>
                        )}
                        <th className="py-4 px-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                            {tCommon("actions")}
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {services.map((service) => (
                        <tr
                            key={service.id}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                            <td className="py-4 px-4">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {service.name}
                                        </span>
                                        <Badge variant={service.isRequired ? "info" : "neutral"} className="text-[10px] px-1.5 py-0">
                                            {service.isRequired ? t("required") : t("optional")}
                                        </Badge>
                                    </div>
                                    {service.description && (
                                        <span className="text-xs text-slate-500 line-clamp-1">
                                            {service.description}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {service.complex?.name || "—"}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-900 dark:text-white font-medium">
                                {formatPrice(service.basePrice)}
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant="neutral">
                                    {frequencyLabel(service.frequency)}
                                </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400 text-center">
                                {service._count.unitServices}
                            </td>
                            {userRole === Role.RESIDENT && (
                                <td className="py-4 px-4 text-center">
                                    {service.hasQuantity && !service.unitServices?.length && !service.isRequired ? (
                                        <input
                                            id={`qty-${service.id}`}
                                            type="number"
                                            min="1"
                                            defaultValue={String(service.defaultQuantity ?? 1)}
                                            className="w-20 px-2 py-1 text-sm border rounded dark:bg-background-dark dark:border-slate-700"
                                        />
                                    ) : service.hasQuantity && service.unitServices?.length ? (
                                        <input
                                            id={`qty-edit-${service.unitServices[0].id}`}
                                            type="number"
                                            min="1"
                                            defaultValue={String(service.unitServices[0].quantity)}
                                            className="w-20 px-2 py-1 text-sm border rounded dark:bg-background-dark dark:border-slate-700 border-emerald-200 dark:border-emerald-800"
                                            disabled={service.isRequired || userRole === Role.RESIDENT}
                                        />
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                            )}
                            {userRole === Role.RESIDENT && (
                                <td className="py-4 px-4 text-center">
                                    {service.unitServices?.length ? (
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {new Date(service.unitServices[0].startDate).toLocaleDateString()}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                            )}
                            <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                    {userRole === Role.RESIDENT ? (
                                        (() => {
                                            const isSubscribed = service.unitServices && service.unitServices.length > 0;
                                            if (isSubscribed) {
                                                const unitService = service.unitServices![0];
                                                const canUnsubscribe = true; // Enabled anytime as requested

                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="success">
                                                            <div className="flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                                {t("subscribed")}
                                                            </div>
                                                        </Badge>
                                                        {!service.isRequired && (
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    variant="danger"
                                                                    size="sm"
                                                                    onClick={() => onUnsubscribe?.(unitService.id)}
                                                                    title={t("unsubscribe")}
                                                                    disabled={!!isSubmitting}
                                                                >
                                                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            }
                                            if (service.isRequired) {
                                                return (
                                                    <Badge variant="info">
                                                        <div className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">info</span>
                                                            {t("required")}
                                                        </div>
                                                    </Badge>
                                                );
                                            }
                                            return (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => {
                                                            const input = document.getElementById(`qty-${service.id}`) as HTMLInputElement;
                                                            const qty = input ? parseInt(input.value) : 1;
                                                            onSubscribe?.(service, qty);
                                                        }}
                                                        isLoading={isSubmitting === service.id}
                                                        disabled={!!isSubmitting}
                                                    >
                                                        {t("book")}
                                                    </Button>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        (userRole === Role.SUPER_ADMIN ||
                                            userRole === Role.ADMIN ||
                                            userRole === Role.BOARD_OF_DIRECTORS) && (
                                            <>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => onEdit?.(service)}
                                                    title={tCommon("edit")}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        edit
                                                    </span>
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => onDelete?.(service.id)}
                                                    title={tCommon("delete")}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        delete
                                                    </span>
                                                </Button>
                                            </>
                                        )
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {services.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-slate-500">{t("noServicesFound")}</p>
                </div>
            )}
        </div>
    );
}

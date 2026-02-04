"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { Role } from "@prisma/client";

interface ServiceWithCount {
    id: string;
    name: string;
    description: string | null;
    basePrice: any;
    frequency: string;
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

const frequencyMap: Record<string, string> = {
    ONCE: "Una vez",
    DAILY: "Diario",
    WEEKLY: "Semanal",
    MONTHLY: "Mensual",
    YEARLY: "Anual",
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
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            Nombre
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            Complejo
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            Precio Base
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            Frecuencia
                        </th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                            Unidades Asignadas
                        </th>
                        {userRole === Role.RESIDENT && (
                            <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">
                                Cantidad
                            </th>
                        )}
                        <th className="py-4 px-4 text-right text-sm font-semibold text-slate-900 dark:text-white">
                            Acciones
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
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {service.name}
                                    </span>
                                    {service.description && (
                                        <span className="text-xs text-slate-500 line-clamp-1">
                                            {service.description}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {service.complex?.name || "N/A"}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-900 dark:text-white font-medium">
                                {formatPrice(service.basePrice)}
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant="neutral">
                                    {frequencyMap[service.frequency] || service.frequency}
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
                                            defaultValue="1"
                                            className="w-20 px-2 py-1 text-sm border rounded dark:bg-slate-800 dark:border-slate-700"
                                        />
                                    ) : service.hasQuantity && service.unitServices?.length ? (
                                        <input
                                            id={`qty-edit-${service.unitServices[0].id}`}
                                            type="number"
                                            min="1"
                                            defaultValue={service.unitServices[0].quantity}
                                            className="w-20 px-2 py-1 text-sm border rounded dark:bg-slate-800 dark:border-slate-700 border-emerald-200 dark:border-emerald-800"
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
                                                const hiringDate = new Date(unitService.startDate);
                                                const oneMonthAgo = new Date();
                                                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                                                const canUnsubscribe = hiringDate <= oneMonthAgo;

                                                return (
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="success">
                                                            <div className="flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                                Contratado
                                                            </div>
                                                        </Badge>
                                                        {!service.isRequired && (
                                                            <div className="flex gap-1">
                                                                {service.hasQuantity && userRole !== Role.RESIDENT && (
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            const input = document.getElementById(`qty-edit-${unitService.id}`) as HTMLInputElement;
                                                                            const qty = input ? parseInt(input.value) : unitService.quantity;
                                                                            onUpdateQuantity?.(unitService.id, qty);
                                                                        }}
                                                                        title="Actualizar Cantidad"
                                                                        isLoading={isSubmitting === unitService.id}
                                                                        disabled={!!isSubmitting}
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">save</span>
                                                                    </Button>
                                                                )}
                                                                {canUnsubscribe ? (
                                                                    <Button
                                                                        variant="danger"
                                                                        size="sm"
                                                                        onClick={() => onUnsubscribe?.(unitService.id)}
                                                                        title="Dar de baja"
                                                                        disabled={!!isSubmitting}
                                                                    >
                                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                    </Button>
                                                                ) : (
                                                                    <div title="Debe cumplir al menos un mes de contratación para dar de baja" className="cursor-help opacity-30 grayscale pointer-events-none">
                                                                        <Button variant="danger" size="sm" disabled>
                                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                                        </Button>
                                                                    </div>
                                                                )}
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
                                                            Obligatorio
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
                                                        Contratar
                                                    </Button>
                                                </div>
                                            );
                                        })()
                                    ) : (
                                        userRole !== Role.GUARD && userRole !== Role.OPERATOR && (
                                            <>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => onEdit?.(service)}
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        edit
                                                    </span>
                                                </Button>
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => onDelete?.(service.id)}
                                                    title="Eliminar"
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
                    <p className="text-slate-500">No se encontraron servicios.</p>
                </div>
            )}
        </div>
    );
}

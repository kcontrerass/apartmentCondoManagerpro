"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

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
}

interface ServiceTableProps {
    services: ServiceWithCount[];
    onEdit?: (service: ServiceWithCount) => void;
    onDelete?: (serviceId: string) => void;
}

const frequencyMap: Record<string, string> = {
    ONCE: "Una vez",
    DAILY: "Diario",
    WEEKLY: "Semanal",
    MONTHLY: "Mensual",
    YEARLY: "Anual",
};

export function ServiceTable({ services, onEdit, onDelete }: ServiceTableProps) {
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
                                ${Number(service.basePrice).toFixed(2)}
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant="neutral">
                                    {frequencyMap[service.frequency] || service.frequency}
                                </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400 text-center">
                                {service._count.unitServices}
                            </td>
                            <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
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

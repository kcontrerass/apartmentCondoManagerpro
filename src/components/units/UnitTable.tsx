"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Unit, Resident, User, Role } from "@prisma/client";
import { useState } from "react";

interface UnitWithResidents extends Unit {
    residents: (Resident & { user: { name: string; email: string } })[];
    complex?: { name: string };
}

interface UnitTableProps {
    units: UnitWithResidents[];
    userRole?: Role;
    onEdit?: (unit: UnitWithResidents) => void;
    onDelete?: (unitId: string) => void;
    onView?: (unitId: string) => void;
}

export function UnitTable({ units, userRole, onEdit, onDelete, onView }: UnitTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">Número</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">Complejo</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">Tipo</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">Capacidad</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">Estado</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">Residente Principal</th>
                        <th className="py-4 px-4 text-right text-sm font-semibold text-slate-900 dark:text-white">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {units.map((unit) => (
                        <tr key={unit.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 px-4">
                                <span className="font-medium text-slate-900 dark:text-white">{unit.number}</span>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {unit.complex?.name || "N/A"}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {unit.type || "N/A"}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {unit.bedrooms} hab / {unit.bathrooms} baños
                            </td>
                            <td className="py-4 px-4">
                                <Badge
                                    variant={
                                        unit.status === 'OCCUPIED' ? 'success' :
                                            unit.status === 'MAINTENANCE' ? 'warning' : 'neutral'
                                    }
                                >
                                    {unit.status === 'OCCUPIED' ? 'Ocupada' :
                                        unit.status === 'MAINTENANCE' ? 'Mantenimiento' : 'Vacante'}
                                </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {unit.residents[0]?.user.name || "Sin residente"}
                            </td>
                            <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => onView?.(unit.id)}
                                        title="Ver detalle"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                    </Button>

                                    {userRole !== Role.GUARD && userRole !== Role.OPERATOR && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => onEdit?.(unit)}
                                                title="Editar"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </Button>
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => onDelete?.(unit.id)}
                                                title="Eliminar"
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
                    <p className="text-slate-500">No se encontraron unidades.</p>
                </div>
            )}
        </div>
    );
}

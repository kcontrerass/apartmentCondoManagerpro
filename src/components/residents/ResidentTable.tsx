"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Resident, User, Unit, Complex } from "@prisma/client";
import { Role } from "@/types/roles";

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
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">Nombre</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">Unidad</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">Desde</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">Contacto Emergencia</th>
                        <th className="py-4 px-4 text-right text-sm font-semibold text-slate-900 dark:text-white">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {residents.map((resident) => {
                        const emergency = resident.emergencyContact as any;
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
                                            Unidad {resident.unit.number}
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
                                    ) : "N/A"}
                                </td>
                                <td className="py-4 px-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => onView?.(resident.id)}>
                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                        </Button>

                                        {userRole !== Role.GUARD && userRole !== Role.BOARD_OF_DIRECTORS && (
                                            <>
                                                <Button variant="secondary" size="sm" onClick={() => onEdit?.(resident)}>
                                                    <span className="material-symbols-outlined text-[18px]">edit</span>
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => onDelete?.(resident.id)}>
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
                    <p className="text-slate-500">No se encontraron residentes.</p>
                </div>
            )}
        </div>
    );
}

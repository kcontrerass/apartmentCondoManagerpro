"use client";

import { Complex, ComplexType } from "@prisma/client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface ComplexWithCount extends Complex {
    _count?: {
        units: number;
        amenities: number;
    };
}

interface ComplexTableProps {
    complexes: ComplexWithCount[];
    onDelete?: (id: string) => void;
}

export function ComplexTable({ complexes, onDelete }: ComplexTableProps) {
    const getTypeBadgeVariant = (type: ComplexType) => {
        switch (type) {
            case ComplexType.BUILDING:
                return "info";
            case ComplexType.RESIDENTIAL:
                return "success";
            case ComplexType.CONDO:
                return "warning";
            default:
                return "neutral";
        }
    };

    return (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium uppercase text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Nombre</th>
                        <th className="px-6 py-4">Tipo</th>
                        <th className="px-6 py-4">Dirección</th>
                        <th className="px-6 py-4 text-center">Unidades</th>
                        <th className="px-6 py-4 text-center">Amenidades</th>
                        <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {complexes.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                                No se encontraron complejos.
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
                                            <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                <span className="material-symbols-rounded text-lg">apartment</span>
                                            </div>
                                        )}
                                        {complex.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <Badge variant={getTypeBadgeVariant(complex.type)}>
                                        {complex.type}
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
                                <td className="px-6 py-4 text-right space-x-2">
                                    <Link href={`/dashboard/complexes/${complex.id}`}>
                                        <Button variant="secondary" size="sm">Ver</Button>
                                    </Link>
                                    <Link href={`/dashboard/complexes/${complex.id}/edit`}>
                                        <Button variant="secondary" size="sm">Editar</Button>
                                    </Link>
                                    {onDelete && (
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => onDelete(complex.id)}
                                        >
                                            Eliminar
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

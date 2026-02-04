'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IncidentListItem, IncidentStatus, IncidentPriority, IncidentType } from '@/types/incident';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface IncidentTableProps {
    incidents: IncidentListItem[];
    onUpdateStatus: (id: string, status: IncidentStatus) => void;
    onDelete: (id: string) => void;
    canManage: boolean;
}

const IncidentTable: React.FC<IncidentTableProps> = ({
    incidents,
    onUpdateStatus,
    onDelete,
    canManage
}) => {
    const getStatusVariant = (status: IncidentStatus) => {
        switch (status) {
            case 'REPORTED': return 'warning';
            case 'IN_PROGRESS': return 'info';
            case 'RESOLVED': return 'success';
            case 'CANCELLED': return 'error';
            default: return 'neutral';
        }
    };

    const getPriorityVariant = (priority: IncidentPriority) => {
        switch (priority) {
            case 'URGENT': return 'error';
            case 'HIGH': return 'warning';
            case 'LOW': return 'neutral';
            default: return 'success';
        }
    };

    const getTypeLabel = (type: IncidentType) => {
        switch (type) {
            case 'MAINTENANCE': return 'Mantenimiento';
            case 'SECURITY': return 'Seguridad';
            case 'NOISE': return 'Ruidos';
            case 'CLEANING': return 'Limpieza';
            default: return 'Otro';
        }
    };

    const formatDate = (date: Date | string | null) => {
        if (!date) return '-';
        return format(new Date(date), "d 'de' MMM, HH:mm", { locale: es });
    };

    if (incidents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">report_off</span>
                <p className="text-slate-500 font-medium">No hay incidentes reportados</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider">
                        <th className="py-4 px-4 font-bold text-slate-400">Título / Reportado por</th>
                        <th className="py-4 px-4 font-bold text-slate-400">Tipo</th>
                        <th className="py-4 px-4 font-bold text-slate-400">Prioridad</th>
                        <th className="py-4 px-4 font-bold text-slate-400">Estado</th>
                        <th className="py-4 px-4 font-bold text-slate-400">Fecha</th>
                        <th className="py-4 px-4 text-right font-bold text-slate-400">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {incidents.map((incident) => (
                        <tr key={incident.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="py-4 px-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                        {incident.title}
                                    </span>
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">person</span>
                                            {incident.reporterName} {incident.unitNumber ? `(Unidad ${incident.unitNumber})` : ''}
                                        </span>
                                        {incident.complexName && (
                                            <span className="text-xs text-primary font-medium flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">apartment</span>
                                                {incident.complexName}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="py-4 px-4">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                    {getTypeLabel(incident.type)}
                                </span>
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant={getPriorityVariant(incident.priority)}>
                                    {incident.priority}
                                </Badge>
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant={getStatusVariant(incident.status)}>
                                    {incident.status}
                                </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {formatDate(incident.createdAt)}
                            </td>
                            <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Link href={`/dashboard/incidents/${incident.id}`}>
                                        <Button variant="secondary" size="sm" icon="visibility" />
                                    </Link>
                                    {canManage && (
                                        <div className="flex gap-2">
                                            {incident.status === 'REPORTED' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    icon="play_arrow"
                                                    onClick={() => onUpdateStatus(incident.id, 'IN_PROGRESS')}
                                                    title="Iniciar"
                                                />
                                            )}
                                            {incident.status === 'IN_PROGRESS' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    icon="check"
                                                    onClick={() => onUpdateStatus(incident.id, 'RESOLVED')}
                                                    title="Resolver"
                                                />
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon="delete"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => onDelete(incident.id)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default IncidentTable;

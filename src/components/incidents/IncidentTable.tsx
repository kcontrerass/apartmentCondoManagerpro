'use client';

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { IncidentListItem, IncidentStatus, IncidentPriority, IncidentType } from '@/types/incident';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

interface IncidentTableProps {
    incidents: IncidentListItem[];
    onUpdateStatus: (id: string, status: IncidentStatus) => void;
    onDelete: (id: string) => void;
    canManage: boolean;
    canDelete: boolean;
}

const IncidentTable: React.FC<IncidentTableProps> = ({
    incidents,
    onUpdateStatus,
    onDelete,
    canManage,
    canDelete
}) => {
    const t = useTranslations('Incidents');
    const tCommon = useTranslations('Common');
    const locale = useLocale();
    const dateLocale = locale === 'es' ? es : enUS;

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

    const formatDate = (date: Date | string | null) => {
        if (!date) return '-';
        return format(new Date(date), 'PPp', { locale: dateLocale });
    };

    if (incidents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">report_off</span>
                <p className="text-slate-500 font-medium">{t('empty')}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider">
                        <th className="py-4 px-4 font-bold text-slate-400">{t('table.titleReporter')}</th>
                        <th className="py-4 px-4 font-bold text-slate-400">{t('table.type')}</th>
                        <th className="py-4 px-4 font-bold text-slate-400">{t('table.priority')}</th>
                        <th className="py-4 px-4 font-bold text-slate-400">{t('table.status')}</th>
                        <th className="py-4 px-4 font-bold text-slate-400">{t('table.date')}</th>
                        <th className="py-4 px-4 text-right font-bold text-slate-400">{tCommon('actions')}</th>
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
                                            {incident.reporterName}{' '}
                                            {incident.unitNumber ? t('unitWithNumber', { number: incident.unitNumber }) : ''}
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
                                    {t(`types.${incident.type}` as never)}
                                </span>
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant={getPriorityVariant(incident.priority)}>
                                    {t(`priority.${incident.priority}` as never)}
                                </Badge>
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant={getStatusVariant(incident.status)}>
                                    {t(`status.${incident.status}` as never)}
                                </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {formatDate(incident.createdAt)}
                            </td>
                            <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Link href={`/dashboard/incidents/${incident.id}`}>
                                        <Button variant="secondary" size="sm" icon="visibility" title={tCommon('view')} />
                                    </Link>
                                    {canManage && (
                                        <div className="flex gap-2">
                                            {incident.status === 'REPORTED' && (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    icon="play_arrow"
                                                    onClick={() => onUpdateStatus(incident.id, 'IN_PROGRESS')}
                                                    title={t('start')}
                                                />
                                            )}
                                            {incident.status === 'IN_PROGRESS' && (
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    icon="check"
                                                    onClick={() => onUpdateStatus(incident.id, 'RESOLVED')}
                                                    title={t('resolve')}
                                                />
                                            )}
                                            {canDelete && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    icon="delete"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => onDelete(incident.id)}
                                                    title={tCommon('delete')}
                                                />
                                            )}
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

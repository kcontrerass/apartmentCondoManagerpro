'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AnnouncementPriority, AnnouncementListItem } from '@/types/announcement';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface AnnouncementTableProps {
    announcements: AnnouncementListItem[];
    onEdit: (announcement: AnnouncementListItem) => void;
    onDelete: (id: string) => void;
    canManage: boolean;
}

const AnnouncementTable: React.FC<AnnouncementTableProps> = ({
    announcements,
    onEdit,
    onDelete,
    canManage
}) => {
    const t = useTranslations('announcements');

    const getPriorityVariant = (priority: AnnouncementPriority) => {
        switch (priority) {
            case 'URGENT': return 'error';
            case 'HIGH': return 'warning';
            case 'LOW': return 'neutral';
            default: return 'success';
        }
    };

    const getPriorityLabel = (priority: AnnouncementPriority) => {
        switch (priority) {
            case 'URGENT': return 'Urgente';
            case 'HIGH': return 'Alta';
            case 'LOW': return 'Baja';
            default: return 'Normal';
        }
    };

    const formatDate = (date: Date | string | null) => {
        if (!date) return '-';
        return format(new Date(date), "d 'de' MMM, yyyy", { locale: es });
    };

    if (announcements.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">notifications_off</span>
                <p className="text-slate-500 font-medium">{t('noAnnouncements')}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t('title')}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t('priority')}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t('publishedAt')}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t('expiresAt')}</th>
                        <th className="py-4 px-4 text-right text-sm font-semibold text-slate-900 dark:text-white">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {announcements.map((announcement) => (
                        <tr key={announcement.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="py-4 px-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                        {announcement.title}
                                    </span>
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">person</span>
                                            {announcement.authorName}
                                        </span>
                                        {announcement.complex && (
                                            <span className="text-xs text-primary font-medium flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[14px]">apartment</span>
                                                {announcement.complex.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="py-4 px-4">
                                <Badge variant={getPriorityVariant(announcement.priority)}>
                                    {getPriorityLabel(announcement.priority)}
                                </Badge>
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {formatDate(announcement.publishedAt)}
                            </td>
                            <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-400">
                                {formatDate(announcement.expiresAt)}
                            </td>
                            <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Link href={`/dashboard/announcements/${announcement.id}`}>
                                        <Button variant="secondary" size="sm" icon="visibility" />
                                    </Link>
                                    {canManage && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                icon="edit"
                                                onClick={() => onEdit(announcement)}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon="delete"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => onDelete(announcement.id)}
                                            />
                                        </>
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

export default AnnouncementTable;

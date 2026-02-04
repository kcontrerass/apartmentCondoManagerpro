'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { EventListItem } from '@/types/event';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface EventTableProps {
    events: EventListItem[];
    onEdit: (event: EventListItem) => void;
    onDelete: (id: string) => void;
    canManage: boolean;
}

const EventTable: React.FC<EventTableProps> = ({
    events,
    onEdit,
    onDelete,
    canManage
}) => {
    const t = useTranslations('events');

    const formatDate = (date: Date | string) => {
        return format(new Date(date), "d 'de' MMM, yyyy", { locale: es });
    };

    const formatTime = (date: Date | string) => {
        return format(new Date(date), "HH:mm");
    };

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-6xl text-slate-200 mb-6">calendar_month</span>
                <p className="text-slate-500 font-medium">{t('noEvents') || 'No hay eventos programados'}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t('title')}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t('dateTime')}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t('location')}</th>
                        <th className="py-4 px-4 text-sm font-semibold text-slate-900 dark:text-white">{t('attendees')}</th>
                        <th className="py-4 px-4 text-right text-sm font-semibold text-slate-900 dark:text-white">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {events.map((event) => (
                        <tr key={event.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                            <td className="py-4 px-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                        {event.title}
                                    </span>
                                    {event.complex && (
                                        <span className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                                            <span className="material-symbols-outlined text-[14px]">apartment</span>
                                            {event.complex.name}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="py-4 px-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {formatDate(event.eventDate)}
                                    </span>
                                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                                    </span>
                                </div>
                            </td>
                            <td className="py-4 px-4">
                                <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
                                    {event.location || 'N/A'}
                                </div>
                            </td>
                            <td className="py-4 px-4">
                                <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                                    <span className="material-symbols-outlined text-[18px] text-slate-400">group</span>
                                    {event._count.rsvps}
                                </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Link href={`/dashboard/events/${event.id}`}>
                                        <Button variant="secondary" size="sm" icon="visibility" />
                                    </Link>
                                    {canManage && (
                                        <>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                icon="edit"
                                                onClick={() => onEdit(event)}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                icon="delete"
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => onDelete(event.id)}
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

export default EventTable;

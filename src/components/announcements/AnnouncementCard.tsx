'use client';

import React from 'react';
import {
    BellIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    CalendarDaysIcon,
    UserIcon,
    ClockIcon
} from '@heroicons/react/24/outline';
import { AnnouncementPriority, AnnouncementListItem } from '@/types/announcement';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface AnnouncementCardProps {
    announcement: AnnouncementListItem;
}

const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement }) => {
    const getPriorityInfo = (priority: AnnouncementPriority) => {
        switch (priority) {
            case 'URGENT':
                return {
                    color: 'text-red-600 bg-red-50 border-red-100',
                    dot: 'bg-red-600',
                    icon: <ExclamationCircleIcon className="w-4 h-4" />,
                    label: 'Urgente'
                };
            case 'HIGH':
                return {
                    color: 'text-orange-600 bg-orange-50 border-orange-100',
                    dot: 'bg-orange-600',
                    icon: <ExclamationCircleIcon className="w-4 h-4" />,
                    label: 'Importante'
                };
            default:
                return {
                    color: 'text-primary bg-primary-light/10 border-primary-light/20',
                    dot: 'bg-primary',
                    icon: <InformationCircleIcon className="w-4 h-4" />,
                    label: 'Aviso'
                };
        }
    };

    const priorityInfo = getPriorityInfo(announcement.priority);

    return (
        <Link
            href={`/dashboard/announcements/${announcement.id}`}
            className="block group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
        >
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${priorityInfo.color}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${priorityInfo.dot} animate-pulse`} />
                        {priorityInfo.label}
                    </span>
                    <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                        {announcement.publishedAt ? format(new Date(announcement.publishedAt), "dd MMM", { locale: es }) : '-'}
                    </span>
                </div>

                <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 mb-3 leading-tight">
                    {announcement.title}
                </h3>

                <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center text-xs text-gray-500 font-medium">
                        <UserIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {announcement.authorName}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 font-medium">
                        <ClockIcon className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                        {announcement.publishedAt ? format(new Date(announcement.publishedAt), "HH:mm") : '-'}
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default AnnouncementCard;

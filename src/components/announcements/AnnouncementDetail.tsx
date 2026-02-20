'use client';

import React from 'react';
import {
    BellIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    CalendarDaysIcon,
    UserIcon,
    ClockIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { AnnouncementPriority, Announcement } from '@/types/announcement';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface AnnouncementDetailProps {
    announcement: Announcement;
    onBack?: () => void;
}

const AnnouncementDetail: React.FC<AnnouncementDetailProps> = ({ announcement, onBack }) => {
    const getPriorityInfo = (priority: AnnouncementPriority) => {
        switch (priority) {
            case 'URGENT':
                return {
                    color: 'text-red-700 bg-red-50 border-red-200',
                    icon: <ExclamationCircleIcon className="w-5 h-5 mr-2" />,
                    label: 'Comunicado Urgente'
                };
            case 'HIGH':
                return {
                    color: 'text-orange-700 bg-orange-50 border-orange-200',
                    icon: <ExclamationCircleIcon className="w-5 h-5 mr-2" />,
                    label: 'Aviso Importante'
                };
            default:
                return {
                    color: 'text-blue-700 bg-blue-50 border-blue-200',
                    icon: <InformationCircleIcon className="w-5 h-5 mr-2" />,
                    label: 'Información General'
                };
        }
    };

    const priorityInfo = getPriorityInfo(announcement.priority);

    return (
        <div className="max-w-4xl mx-auto">
            <button
                onClick={onBack}
                className="flex items-center text-sm font-bold text-gray-500 hover:text-primary transition-colors mb-6 group"
            >
                <ArrowLeftIcon className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Volver a la lista
            </button>

            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                {/* Header Section */}
                <div className={`px-8 py-6 border-b border-gray-100 ${priorityInfo.color} flex flex-wrap items-center justify-between gap-4`}>
                    <div className="flex items-center font-bold text-sm tracking-wide uppercase">
                        {priorityInfo.icon}
                        {priorityInfo.label}
                    </div>
                    <div className="flex items-center text-sm font-medium opacity-80">
                        <CalendarDaysIcon className="w-4 h-4 mr-2" />
                        {(() => {
                            try {
                                return announcement.publishedAt ? format(new Date(announcement.publishedAt), "PPP", { locale: es }) : '-';
                            } catch (e) {
                                return '-';
                            }
                        })()}
                    </div>
                </div>

                <div className="p-8 md:p-12">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-8 leading-tight">
                        {announcement.title}
                    </h1>

                    {announcement.imageUrl && (
                        <div className="relative aspect-video mb-10 rounded-2xl overflow-hidden shadow-lg">
                            <img
                                src={announcement.imageUrl}
                                alt={announcement.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed mb-12">
                        {announcement.content.split('\n').map((para, idx) => (
                            <p key={idx} className="mb-4 last:mb-0">{para}</p>
                        ))}
                    </div>

                    {/* Footer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-10 border-t border-gray-100 mt-auto">
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Publicado por</span>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-primary border border-gray-200 shadow-inner">
                                    <UserIcon className="w-5 h-5" />
                                </div>
                                <span className="font-bold text-gray-900">{announcement.authorName}</span>
                            </div>
                        </div>

                        {announcement.expiresAt && (
                            <div className="flex flex-col md:items-end">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 text-left md:text-right">Vigente hasta</span>
                                <div className="flex items-center gap-2 text-gray-600 font-medium">
                                    <ClockIcon className="w-4 h-4" />
                                    {(() => {
                                        try {
                                            return format(new Date(announcement.expiresAt), "PPP", { locale: es });
                                        } catch (e) {
                                            return '-';
                                        }
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnouncementDetail;

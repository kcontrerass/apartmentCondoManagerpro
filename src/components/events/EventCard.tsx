'use client';

import React from 'react';
import { EventListItem } from '@/types/event';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface EventCardProps {
    event: EventListItem;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
    const isExpired = new Date(event.eventDate) < new Date();

    return (
        <Link
            href={`/dashboard/events/${event.id}`}
            className="block group bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
        >
            {event.imageUrl ? (
                <div className="relative h-52 w-full overflow-hidden">
                    <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent"></div>
                    {isExpired && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                            <span className="px-5 py-2 bg-white/10 text-white border border-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
                                Concluido
                            </span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="h-52 w-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>
                    <span className="material-symbols-outlined text-6xl text-primary/30 group-hover:scale-110 transition-transform duration-500">event</span>
                    {isExpired && (
                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                            <span className="px-5 py-2 bg-white/20 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md border border-white/20">
                                Concluido
                            </span>
                        </div>
                    )}
                </div>
            )}

            <div className="p-7">
                <div className="mb-4 flex flex-wrap gap-2">
                    <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1.5 rounded-full tracking-widest uppercase border border-primary/10">
                        {format(new Date(event.eventDate), "EEEE d 'de' MMMM", { locale: es })}
                    </span>
                    {event.complex && (
                        <span className="text-[10px] font-black text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-3 py-1.5 rounded-full tracking-widest uppercase border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">apartment</span>
                            {event.complex.name}
                        </span>
                    )}
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1 mb-5">
                    {event.title}
                </h3>

                <div className="space-y-4">
                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center mr-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[18px]">schedule</span>
                        </div>
                        {format(new Date(event.startTime), "HH:mm")} - {format(new Date(event.endTime), "HH:mm")}
                    </div>

                    {event.location && (
                        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center mr-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                <span className="material-symbols-outlined text-[18px]">location_on</span>
                            </div>
                            <span className="line-clamp-1">{event.location}</span>
                        </div>
                    )}

                    <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center mr-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-[18px]">groups</span>
                        </div>
                        {event._count.rsvps} <span className="ml-1.5">confirmados</span>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default EventCard;

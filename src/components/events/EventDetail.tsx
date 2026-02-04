'use client';

import React from 'react';
import {
    CalendarIcon,
    MapPinIcon,
    UsersIcon,
    ClockIcon,
    ArrowLeftIcon,
    UserIcon,
    CheckCircleIcon,
    XCircleIcon,
    QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { Event, RSVPStatus } from '@/types/event';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';

interface EventDetailProps {
    event: Event & {
        currentUserRsvp?: any;
        stats: { going: number; maybe: number; not_going: number };
    };
    onRSVP: (status: RSVPStatus, guests: number) => Promise<void>;
    onBack: () => void;
    isSubmittingRSVP?: boolean;
}

const EventDetail: React.FC<EventDetailProps> = ({
    event,
    onRSVP,
    onBack,
    isSubmittingRSVP
}) => {
    const isExpired = new Date(event.eventDate) < new Date();

    const rsvpOptions: { status: RSVPStatus; label: string; icon: any; color: string }[] = [
        { status: 'GOING', label: 'Asistiré', icon: CheckCircleIcon, color: 'text-green-600 bg-green-50 border-green-100' },
        { status: 'MAYBE', label: 'Tal vez', icon: QuestionMarkCircleIcon, color: 'text-orange-600 bg-orange-50 border-orange-100' },
        { status: 'NOT_GOING', label: 'No asistiré', icon: XCircleIcon, color: 'text-red-600 bg-red-50 border-red-100' },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <button
                onClick={onBack}
                className="flex items-center text-sm font-bold text-slate-400 hover:text-primary transition-colors group"
            >
                <ArrowLeftIcon className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                Volver a eventos
            </button>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col md:flex-row">
                {/* Left Side: Info & Image */}
                <div className="flex-1 p-8 md:p-12 space-y-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center px-4 py-2 bg-primary/5 text-primary rounded-2xl text-xs font-bold uppercase tracking-widest">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {format(new Date(event.eventDate), "EEEE d 'de' MMMM", { locale: es })}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight">
                            {event.title}
                        </h1>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-y border-slate-50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <ClockIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Horario</p>
                                <p className="text-sm font-extrabold text-slate-700">
                                    {format(new Date(event.startTime), "HH:mm")} - {format(new Date(event.endTime), "HH:mm")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <MapPinIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ubicación</p>
                                <p className="text-sm font-extrabold text-slate-700">{event.location || 'Consultar con administración'}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <UserIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Organizado por</p>
                                <p className="text-sm font-extrabold text-slate-700">{event.organizerName}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                                <UsersIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Asistentes</p>
                                <p className="text-sm font-extrabold text-slate-700">
                                    {event.stats.going} Confirmados
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="prose prose-lg max-w-none text-slate-600 font-medium leading-relaxed">
                        {event.description.split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                        ))}
                    </div>
                </div>

                {/* Right Side: Media & RSVP */}
                <div className="w-full md:w-[380px] bg-slate-50/50 p-8 md:p-12 border-l border-slate-100 flex flex-col gap-8">
                    {event.imageUrl && (
                        <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-slate-200 shadow-inner">
                            <img
                                src={event.imageUrl}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {!isExpired && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-100 border border-slate-100">
                                <h3 className="text-lg font-extrabold text-slate-900 mb-6 flex items-center gap-3">
                                    ¿Asistirás al evento?
                                </h3>

                                <div className="flex flex-col gap-3">
                                    {rsvpOptions.map((opt) => (
                                        <button
                                            key={opt.status}
                                            disabled={isSubmittingRSVP}
                                            onClick={() => onRSVP(opt.status, 0)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all group ${event.currentUserRsvp?.status === opt.status
                                                ? opt.color
                                                : 'bg-white border-slate-50 hover:border-slate-200 text-slate-500'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 font-bold">
                                                <opt.icon className="w-6 h-6" />
                                                {opt.label}
                                            </div>
                                            {event.currentUserRsvp?.status === opt.status && (
                                                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {event.currentUserRsvp?.status === 'GOING' && (
                                    <div className="mt-6 pt-6 border-t border-slate-50 text-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Confirmado como</p>
                                        <p className="text-sm font-extrabold text-primary">Invitado Principal</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {isExpired && (
                        <div className="bg-white p-8 rounded-3xl text-center border border-slate-100 shadow-lg shadow-slate-100">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <ClockIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-extrabold text-slate-900">Evento Finalizado</h3>
                            <p className="text-sm text-slate-400 font-medium mt-2">Ya no es posible confirmar asistencia para este evento.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetail;

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { eventCreateSchema, EventCreateInput } from '@/lib/validations/event';

interface EventFormProps {
    initialData?: Partial<EventCreateInput>;
    onSubmit: (data: EventCreateInput) => Promise<void>;
    isLoading?: boolean;
    complexId: string;
}

const EventForm: React.FC<EventFormProps> = ({
    initialData,
    onSubmit,
    isLoading,
    complexId
}) => {
    const t = useTranslations('events');

    const formatForInput = (dateStr?: string | Date) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().slice(0, 16);
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EventCreateInput>({
        resolver: zodResolver(eventCreateSchema),
        defaultValues: {
            ...initialData,
            complexId,
            eventDate: initialData?.eventDate ? formatForInput(initialData.eventDate) : '',
            startTime: initialData?.startTime ? formatForInput(initialData.startTime) : '',
            endTime: initialData?.endTime ? formatForInput(initialData.endTime) : '',
        },
    });

    React.useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log('[EventForm] Validation Errors:', errors);
        }
    }, [errors]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <input type="hidden" {...register('complexId')} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Title */}
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        {t('title')} *
                    </label>
                    <input
                        {...register('title')}
                        className={`w-full px-5 py-3.5 rounded-2xl border ${errors.title ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'
                            } focus:outline-none transition-all outline-none font-medium shadow-sm`}
                        placeholder="Ej: Fiesta de Fin de Año"
                    />
                    {errors.title && (
                        <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{errors.title.message}</p>
                    )}
                </div>

                {/* Description */}
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Descripción *
                    </label>
                    <textarea
                        {...register('description')}
                        rows={4}
                        className={`w-full px-5 py-3.5 rounded-2xl border ${errors.description ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'
                            } focus:outline-none transition-all outline-none resize-none font-medium shadow-sm`}
                        placeholder="Detalles sobre el evento..."
                    />
                    {errors.description && (
                        <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{errors.description.message}</p>
                    )}
                </div>

                {/* Location */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        {t('location')}
                    </label>
                    <input
                        {...register('location')}
                        className="w-full px-5 py-3.5 rounded-2xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all outline-none font-medium shadow-sm"
                        placeholder="Ej: Salón Social"
                    />
                </div>


                {/* Event Date */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        {t('eventDate')} *
                    </label>
                    <input
                        type="datetime-local"
                        {...register('eventDate')}
                        className={`w-full px-5 py-3.5 rounded-2xl border ${errors.eventDate ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'
                            } focus:outline-none transition-all outline-none font-medium shadow-sm`}
                    />
                    {errors.eventDate && (
                        <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{errors.eventDate.message}</p>
                    )}
                </div>

                {/* Times */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        {t('startTime')} *
                    </label>
                    <input
                        type="datetime-local"
                        {...register('startTime')}
                        className={`w-full px-5 py-3.5 rounded-2xl border ${errors.startTime ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'
                            } focus:outline-none transition-all outline-none font-medium shadow-sm`}
                    />
                    {errors.startTime && (
                        <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{errors.startTime.message}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        {t('endTime')} *
                    </label>
                    <input
                        type="datetime-local"
                        {...register('endTime')}
                        className={`w-full px-5 py-3.5 rounded-2xl border ${errors.endTime ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'
                            } focus:outline-none transition-all outline-none font-medium shadow-sm`}
                    />
                    {errors.endTime && (
                        <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{errors.endTime.message}</p>
                    )}
                </div>

                {/* Max Attendees */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Capacidad Máxima
                    </label>
                    <input
                        type="number"
                        {...register('maxAttendees', { valueAsNumber: true })}
                        className={`w-full px-5 py-3.5 rounded-2xl border ${errors.maxAttendees ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10'
                            } focus:outline-none transition-all outline-none font-medium shadow-sm`}
                        placeholder="Sin límite"
                    />
                    {errors.maxAttendees && (
                        <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{errors.maxAttendees.message}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-6">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-10 py-4 bg-primary text-white font-extrabold rounded-2xl shadow-xl shadow-primary-light/50 hover:bg-primary-dark hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
                >
                    {isLoading ? 'Guardando...' : (initialData?.title ? 'Actualizar Evento' : 'Crear Evento')}
                </button>
            </div>
        </form>
    );
};

export default EventForm;

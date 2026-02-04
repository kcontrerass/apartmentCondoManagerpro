'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { announcementCreateSchema, AnnouncementCreateInput } from '@/lib/validations/announcement';
import { AnnouncementPriority } from '@/types/announcement';

interface AnnouncementFormProps {
    initialData?: Partial<AnnouncementCreateInput>;
    onSubmit: (data: AnnouncementCreateInput) => Promise<void>;
    isLoading?: boolean;
    complexId: string;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
    initialData,
    onSubmit,
    isLoading,
    complexId
}) => {
    const t = useTranslations('announcements');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AnnouncementCreateInput>({
        resolver: zodResolver(announcementCreateSchema),
        defaultValues: {
            complexId,
            priority: 'NORMAL',
            ...initialData,
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...register('complexId')} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('title')} *
                    </label>
                    <input
                        {...register('title')}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.title ? 'border-red-500 ring-red-100' : 'border-gray-200 focus:border-primary focus:ring-primary-light'
                            } focus:outline-none focus:ring-4 transition-all outline-none`}
                        placeholder="Ej: Mantenimiento de elevadores"
                    />
                    {errors.title && (
                        <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.title.message}</p>
                    )}
                </div>

                {/* Priority */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('priority')}
                    </label>
                    <select
                        {...register('priority')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-primary-light focus:outline-none focus:ring-4 transition-all outline-none"
                    >
                        <option value="NORMAL">Normal</option>
                        <option value="LOW">Baja</option>
                        <option value="HIGH">Alta</option>
                        <option value="URGENT">Urgente</option>
                    </select>
                </div>

                {/* Image URL */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('imageUrl')}
                    </label>
                    <input
                        {...register('imageUrl')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-primary-light focus:outline-none focus:ring-4 transition-all outline-none"
                        placeholder="https://ejemplo.com/imagen.jpg"
                    />
                </div>

                {/* dates */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('publishedAt')}
                    </label>
                    <input
                        type="datetime-local"
                        {...register('publishedAt')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-primary-light focus:outline-none focus:ring-4 transition-all outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('expiresAt')}
                    </label>
                    <input
                        type="datetime-local"
                        {...register('expiresAt')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-primary-light focus:outline-none focus:ring-4 transition-all outline-none"
                    />
                </div>

                {/* Content */}
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('content')} *
                    </label>
                    <textarea
                        {...register('content')}
                        rows={6}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.content ? 'border-red-500 ring-red-100' : 'border-gray-200 focus:border-primary focus:ring-primary-light'
                            } focus:outline-none focus:ring-4 transition-all outline-none resize-none`}
                        placeholder="Escribe el aviso detallado aquí..."
                    />
                    {errors.content && (
                        <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.content.message}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary-light hover:bg-primary-dark hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Publicando...' : t('create')}
                </button>
            </div>
        </form>
    );
};

export default AnnouncementForm;

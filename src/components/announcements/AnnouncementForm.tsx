'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { announcementCreateSchema, AnnouncementCreateInput } from '@/lib/validations/announcement';
import { toast } from 'sonner';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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

    const formatDateForInput = (dateStr?: string | Date) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return d.toISOString().slice(0, 10);
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AnnouncementCreateInput>({
        resolver: zodResolver(announcementCreateSchema),
        defaultValues: {
            ...initialData,
            complexId,
            priority: initialData?.priority || 'NORMAL',
            publishedAt: initialData?.publishedAt ? formatDateForInput(initialData.publishedAt) : '',
            expiresAt: initialData?.expiresAt ? formatDateForInput(initialData.expiresAt) : '',
        },
    });

    React.useEffect(() => {
        if (Object.keys(errors).length > 0) {
            console.log('[AnnouncementForm] Validation Errors:', errors);
        }
    }, [errors]);

    return (
        <form onSubmit={handleSubmit(
            (data) => {
                console.log('[AnnouncementForm] Submitting valid data:', data);
                onSubmit(data);
            },
            (err) => {
                console.log('[AnnouncementForm] Validation Failed:', err);
                toast.error(t("validationError"));
            }
        )} className="space-y-6">
            <input type="hidden" {...register('complexId')} />

            {Object.keys(errors).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                    <p className="text-red-800 font-bold text-sm mb-2 flex items-center">
                        <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-red-500" />
                        {t("formFixErrors")}
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                        {Object.entries(errors).map(([key, error]) => (
                            <li key={key} className="text-red-700 text-xs font-medium">
                                <strong>{key}:</strong> {error?.message as string || 'Error de validación'}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

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
                        placeholder={t("titlePlaceholder")}
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
                        <option value="NORMAL">{t("priorityNormal")}</option>
                        <option value="LOW">{t("priorityLow")}</option>
                        <option value="HIGH">{t("priorityHigh")}</option>
                        <option value="URGENT">{t("priorityUrgent")}</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('expiresAt')}
                    </label>
                    <input
                        type="date"
                        {...register('expiresAt')}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.expiresAt ? 'border-red-500 ring-red-100' : 'border-gray-200'
                            } focus:border-primary focus:ring-primary-light focus:outline-none focus:ring-4 transition-all outline-none`}
                    />
                    {errors.expiresAt && (
                        <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.expiresAt.message}</p>
                    )}
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
                        placeholder={t("contentPlaceholder")}
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
                    {isLoading ? t("publishing") : (initialData?.title ? t("update") : t('create'))}
                </button>
            </div>
        </form>
    );
};

export default AnnouncementForm;

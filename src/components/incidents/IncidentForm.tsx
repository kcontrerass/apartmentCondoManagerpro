'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { incidentSchema } from '@/lib/validations/incident';
import { IncidentPriority, IncidentType } from '@/types/incident';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useTranslations } from 'next-intl';

interface IncidentFormProps {
    complexId: string;
    unitId?: string;
    onSubmit: (data: any) => Promise<void>;
    isLoading?: boolean;
}

const IncidentForm: React.FC<IncidentFormProps> = ({
    complexId,
    unitId,
    onSubmit,
    isLoading
}) => {
    const t = useTranslations("Incidents");
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(incidentSchema),
        defaultValues: {
            title: '',
            description: '',
            priority: 'MEDIUM' as IncidentPriority,
            type: 'OTHER' as IncidentType,
            complexId: complexId || '',
            unitId: unitId || '',
            location: '',
            imageUrl: ''
        }
    });

    // React to complexId changes (Crucial for Guard/Operator recovery)
    React.useEffect(() => {
        if (complexId) {
            reset((prev) => ({
                ...prev,
                complexId
            }));
        }
    }, [complexId, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <Input
                        label={t('form.title')}
                        placeholder={t('form.titlePlaceholder')}
                        {...register('title')}
                        error={errors.title?.message as string}
                        required
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        {t('form.description')}
                    </label>
                    <textarea
                        {...register('description')}
                        className={`w-full px-5 py-3.5 rounded-2xl border ${errors.description ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-200 dark:border-slate-800 dark:bg-background-dark focus:border-primary focus:ring-4 focus:ring-primary/10'
                            } focus:outline-none transition-all outline-none resize-none font-medium text-sm`}
                        rows={4}
                        placeholder={t('form.descriptionPlaceholder')}
                    />
                    {errors.description && (
                        <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{errors.description.message as string}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('form.incidentType')}
                    </label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        {...register('type')}
                    >
                        <option value="MAINTENANCE">{t('types.MAINTENANCE' as never)}</option>
                        <option value="SECURITY">{t('types.SECURITY' as never)}</option>
                        <option value="NOISE">{t('types.NOISE' as never)}</option>
                        <option value="CLEANING">{t('types.CLEANING' as never)}</option>
                        <option value="OTHER">{t('types.OTHER' as never)}</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('form.priorityLabel')}
                    </label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        {...register('priority')}
                    >
                        <option value="LOW">{t('form.priorityLow')}</option>
                        <option value="MEDIUM">{t('form.priorityMedium')}</option>
                        <option value="HIGH">{t('form.priorityHigh')}</option>
                        <option value="URGENT">{t('form.priorityUrgent')}</option>
                    </select>
                </div>

                <Input
                    label={t('form.location')}
                    placeholder={t('form.locationPlaceholder')}
                    {...register('location')}
                    error={errors.location?.message as string}
                />


                {/* Hidden fields */}
                <input type="hidden" {...register('complexId')} />
                <input type="hidden" {...register('unitId')} />
            </div>

            <div className="flex justify-end pt-4 gap-4">
                <Button type="submit" isLoading={isLoading} className="w-full md:w-auto">
                    {t('form.submit')}
                </Button>
            </div>
        </form>
    );
};

export default IncidentForm;

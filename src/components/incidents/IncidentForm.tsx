'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { incidentSchema } from '@/lib/validations/incident';
import { IncidentPriority, IncidentType } from '@/types/incident';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(incidentSchema),
        defaultValues: {
            title: '',
            description: '',
            priority: 'MEDIUM' as IncidentPriority,
            type: 'OTHER' as IncidentType,
            complexId,
            unitId: unitId || '',
            location: '',
            imageUrl: ''
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <Input
                        label="Título del Incidente"
                        placeholder="Ej: Fuga de agua en el pasillo, Luces fundidas..."
                        {...register('title')}
                        error={errors.title?.message as string}
                        required
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Descripción Detallada
                    </label>
                    <textarea
                        {...register('description')}
                        className={`w-full px-5 py-3.5 rounded-2xl border ${errors.description ? 'border-red-500 ring-4 ring-red-100' : 'border-slate-200 dark:border-slate-800 dark:bg-slate-900 focus:border-primary focus:ring-4 focus:ring-primary/10'
                            } focus:outline-none transition-all outline-none resize-none font-medium text-sm`}
                        rows={4}
                        placeholder="Describe lo que sucedió con el mayor detalle posible..."
                    />
                    {errors.description && (
                        <p className="mt-1.5 text-xs text-red-500 font-bold ml-1">{errors.description.message as string}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Tipo de Incidente
                    </label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        {...register('type')}
                    >
                        <option value="MAINTENANCE">Mantenimiento</option>
                        <option value="SECURITY">Seguridad</option>
                        <option value="NOISE">Ruidos</option>
                        <option value="CLEANING">Limpieza</option>
                        <option value="OTHER">Otro</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Prioridad
                    </label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        {...register('priority')}
                    >
                        <option value="LOW">Baja - Puede esperar</option>
                        <option value="MEDIUM">Media - Atender pronto</option>
                        <option value="HIGH">Alta - Importante</option>
                        <option value="URGENT">Urgente - Acción inmediata</option>
                    </select>
                </div>

                <Input
                    label="Ubicación Específica (Opcional)"
                    placeholder="Ej: Cerca del elevador, Sótano 1..."
                    {...register('location')}
                    error={errors.location?.message as string}
                />

                <Input
                    label="URL de Imagen (Opcional)"
                    placeholder="https://..."
                    {...register('imageUrl')}
                    error={errors.imageUrl?.message as string}
                />
            </div>

            <div className="flex justify-end pt-4 gap-4">
                <Button type="submit" isLoading={isLoading} className="w-full md:w-auto">
                    Reportar Incidente
                </Button>
            </div>
        </form>
    );
};

export default IncidentForm;

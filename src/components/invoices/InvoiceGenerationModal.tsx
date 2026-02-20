"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateInvoicesSchema, GenerateInvoicesSchema } from "@/lib/validations/invoice";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTranslations } from "next-intl";

interface InvoiceGenerationModalProps {
    onSubmit: (data: GenerateInvoicesSchema) => Promise<void>;
    isLoading: boolean;
    complexes: { id: string, name: string }[];
}

export function InvoiceGenerationModal({ onSubmit, isLoading, complexes }: InvoiceGenerationModalProps) {
    const t = useTranslations('Invoices.modal');
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        getValues,
        formState: { errors }
    } = useForm<GenerateInvoicesSchema>({
        resolver: zodResolver(generateInvoicesSchema),
        defaultValues: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
        }
    });

    const onFormSubmit = (data: GenerateInvoicesSchema) => {
        if (!showConfirm) {
            setShowConfirm(true);
            return;
        }
        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {!showConfirm ? (
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Complejo
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("complexId")}
                        >
                            <option value="">Seleccione un complejo</option>
                            {complexes.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        {errors.complexId && <p className="text-xs text-red-500">{errors.complexId.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('selectMonth')}</label>
                            <select
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                {...register("month", { valueAsNumber: true })}
                            >
                                {Array.from({ length: 12 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(0, i).toLocaleString('es', { month: 'long' })}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label={t('selectYear')}
                            type="number"
                            {...register("year", { valueAsNumber: true })}
                            error={errors.year?.message}
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" isLoading={isLoading} className="w-full">
                            {t('generateButton')}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex gap-3">
                        <span className="material-symbols-outlined text-amber-600">warning</span>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                ¿Confirmar generación masiva?
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                                Se generarán facturas para todas las unidades de <b>{complexes.find(c => c.id === getValues('complexId'))?.name}</b> para el periodo <b>{getValues('month')}/{getValues('year')}</b>.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onClick={() => setShowConfirm(false)}
                            disabled={isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            className="flex-1 bg-amber-600 hover:bg-amber-700 border-amber-600"
                            isLoading={isLoading}
                        >
                            Confirmar y Generar
                        </Button>
                    </div>
                </div>
            )}
        </form>
    );
}

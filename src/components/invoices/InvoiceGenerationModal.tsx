"use client";

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

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<GenerateInvoicesSchema>({
        resolver: zodResolver(generateInvoicesSchema),
        defaultValues: {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 5) // Default to 5th of next month
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

                <Input
                    label={t('dueDate')}
                    type="date"
                    {...register("dueDate")}
                    error={errors.dueDate?.message}
                />
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={isLoading} className="w-full">
                    {isLoading ? t('generating') : t('generateButton')}
                </Button>
            </div>
        </form>
    );
}

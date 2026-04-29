"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, ServiceSchema } from "@/lib/validations/service";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

interface ServiceFormProps {
    initialData?: any;
    onSubmit: (data: ServiceSchema) => Promise<void>;
    isLoading?: boolean;
    complexes?: { id: string; name: string }[];
    showComplexSelector?: boolean;
    defaultComplexId?: string;
}

export function ServiceForm({
    initialData,
    onSubmit,
    isLoading,
    complexes,
    showComplexSelector,
    defaultComplexId,
}: ServiceFormProps) {
    const t = useTranslations("Services");
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(serviceSchema) as any,
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            basePrice: initialData?.basePrice ? Number(initialData.basePrice) : 0,
            frequency: "MONTHLY",
            isRequired: !!initialData?.isRequired,
            hasQuantity: !!initialData?.hasQuantity,
            defaultQuantity:
                initialData?.defaultQuantity != null
                    ? Number(initialData.defaultQuantity)
                    : undefined,
            complexId: initialData?.complexId || defaultComplexId || "",
        },
    });

    const hasQuantityRaw = watch("hasQuantity");
    const hasQuantityEnabled =
        hasQuantityRaw === true || hasQuantityRaw === "true";

    useEffect(() => {
        if (!hasQuantityEnabled) {
            setValue("defaultQuantity", undefined);
        }
    }, [hasQuantityEnabled, setValue]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                {showComplexSelector && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {t("complex")}
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("complexId")}
                        >
                            <option value="">{t("form.selectComplex")}</option>
                            {complexes?.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        {errors.complexId && (
                            <p className="text-xs text-red-500 mt-1">
                                {(errors.complexId as any).message}
                            </p>
                        )}
                    </div>
                )}

                <input type="hidden" {...register("frequency")} />

                <Input
                    label={t("form.serviceName")}
                    placeholder={t("form.serviceNamePlaceholder")}
                    {...register("name")}
                    error={(errors.name as any)?.message}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("form.description")}
                    </label>
                    <textarea
                        className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm min-h-[100px]"
                        placeholder={t("form.descriptionPlaceholder")}
                        {...register("description")}
                    />
                    {errors.description && (
                        <p className="text-xs text-red-500 mt-1">
                            {(errors.description as any)?.message}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label={t("form.basePrice")}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register("basePrice", { valueAsNumber: true })}
                        error={(errors.basePrice as any)?.message}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {t("form.frequency")}
                        </label>
                        <div className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-200">
                            {t("frequencyMonthly")}
                        </div>
                        <p className="text-[10px] text-slate-500">{t("form.frequencyMonthlyHint")}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {t("form.serviceKind")}
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("isRequired")}
                        >
                            <option value="false">{t("form.optionalChoice")}</option>
                            <option value="true">{t("form.requiredAuto")}</option>
                        </select>
                        <p className="text-[10px] text-slate-500">{t("form.requiredHelp")}</p>
                        {errors.isRequired && (
                            <p className="text-xs text-red-500 mt-1">
                                {(errors.isRequired as any).message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {t("form.requiresQuantity")}
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("hasQuantity")}
                        >
                            <option value="false">{t("form.quantityNo")}</option>
                            <option value="true">{t("form.quantityYes")}</option>
                        </select>
                        <p className="text-[10px] text-slate-500">{t("form.quantityHelp")}</p>
                        {errors.hasQuantity && (
                            <p className="text-xs text-red-500 mt-1">
                                {(errors.hasQuantity as any).message}
                            </p>
                        )}
                    </div>

                    {hasQuantityEnabled ? (
                        <div className="md:col-span-2">
                            <Input
                                label={t("form.defaultQuantity")}
                                type="number"
                                min={1}
                                step={1}
                                placeholder={t("form.defaultQuantityPlaceholder")}
                                {...register("defaultQuantity", { valueAsNumber: true })}
                                error={(errors.defaultQuantity as any)?.message}
                            />
                            <p className="text-[10px] text-slate-500 mt-1">
                                {t("form.defaultQuantityHelp")}
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full md:w-auto"
                >
                    {initialData ? t("form.updateService") : t("form.createService")}
                </Button>
            </div>
        </form>
    );
}

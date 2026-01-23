"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceSchema, ServiceSchema } from "@/lib/validations/service";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

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
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(serviceSchema) as any,
        defaultValues: {
            name: initialData?.name || "",
            description: initialData?.description || "",
            basePrice: initialData?.basePrice ? Number(initialData.basePrice) : 0,
            frequency: initialData?.frequency || "MONTHLY",
            isRequired: initialData?.isRequired ? "true" : "false",
            hasQuantity: initialData?.hasQuantity ? "true" : "false",
            complexId: initialData?.complexId || defaultComplexId || "",
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
                {showComplexSelector && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Complejo
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("complexId")}
                        >
                            <option value="">Seleccione un complejo</option>
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

                <Input
                    label="Nombre del Servicio"
                    placeholder="Ej: Mantenimiento, Agua, Seguridad"
                    {...register("name")}
                    error={(errors.name as any)?.message}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Descripción
                    </label>
                    <textarea
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm min-h-[100px]"
                        placeholder="Descripción del servicio..."
                        {...register("description")}
                    />
                    {errors.description && (
                        <p className="text-xs text-red-500 mt-1">
                            {(errors.description as any).message}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Precio Base"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...register("basePrice", { valueAsNumber: true })}
                        error={(errors.basePrice as any)?.message}
                    />

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Frecuencia
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("frequency")}
                        >
                            <option value="ONCE">Una vez</option>
                            <option value="DAILY">Diario</option>
                            <option value="WEEKLY">Semanal</option>
                            <option value="MONTHLY">Mensual</option>
                            <option value="YEARLY">Anual</option>
                        </select>
                        {errors.frequency && (
                            <p className="text-xs text-red-500 mt-1">
                                {(errors.frequency as any).message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Tipo de Servicio
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("isRequired", { setValueAs: (v) => v === "true" })}
                        >
                            <option value="false">Opcional (Disponible para selección)</option>
                            <option value="true">Obligatorio (Asignado a todos automáticamente)</option>
                        </select>
                        <p className="text-[10px] text-slate-500">Los servicios obligatorios se asignan automáticamente a todas las unidades del complejo.</p>
                        {errors.isRequired && (
                            <p className="text-xs text-red-500 mt-1">
                                {(errors.isRequired as any).message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            ¿Requiere Cantidad?
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("hasQuantity", { setValueAs: (v) => v === "true" })}
                        >
                            <option value="false">No (Precio fijo por unidad)</option>
                            <option value="true">Sí (Permite especificar cantidad, ej: 2 parqueos)</option>
                        </select>
                        <p className="text-[10px] text-slate-500">Use esto para servicios como parqueos o bodegas donde una unidad puede tener varios.</p>
                        {errors.hasQuantity && (
                            <p className="text-xs text-red-500 mt-1">
                                {(errors.hasQuantity as any).message}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full md:w-auto"
                >
                    {initialData ? "Actualizar Servicio" : "Crear Servicio"}
                </Button>
            </div>
        </form>
    );
}

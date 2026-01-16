"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { unitSchema, UnitInput } from "@/lib/validations/unit";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Unit } from "@prisma/client";

interface UnitFormProps {
    initialData?: Partial<Unit>;
    onSubmit: (data: UnitInput) => Promise<void>;
    isLoading?: boolean;
    complexes?: { id: string, name: string }[];
    showComplexSelector?: boolean;
}

export function UnitForm({ initialData, onSubmit, isLoading, complexes, showComplexSelector }: UnitFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            number: initialData?.number || "",
            type: initialData?.type || "Apartamento",
            bedrooms: initialData?.bedrooms || 1,
            bathrooms: initialData?.bathrooms || 1,
            area: initialData?.area || 0,
            status: initialData?.status || "VACANT",
            complexId: (initialData as any)?.complexId || "",
        },
    });

    const onFormSubmit = async (data: any) => {
        await onSubmit(data as UnitInput);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
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
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    {(errors as any).complexId && (
                        <p className="text-xs text-red-500 mt-1">{(errors as any).complexId.message}</p>
                    )}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                    label="Número de Unidad"
                    placeholder="Ej: A-101"
                    {...register("number")}
                    error={errors.number?.message as string}
                />

                <Input
                    label="Tipo"
                    placeholder="Ej: Apartamento, Studio"
                    {...register("type")}
                    error={errors.type?.message as string}
                />

                <Input
                    label="Habitaciones"
                    type="number"
                    {...register("bedrooms", { valueAsNumber: true })}
                    error={errors.bedrooms?.message as string}
                />

                <Input
                    label="Baños"
                    type="number"
                    step="0.5"
                    {...register("bathrooms", { valueAsNumber: true })}
                    error={errors.bathrooms?.message as string}
                />

                <Input
                    label="Área (m²)"
                    type="number"
                    {...register("area", { valueAsNumber: true })}
                    error={errors.area?.message as string}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Estado
                    </label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        {...register("status")}
                    >
                        <option value="VACANT">Vacante</option>
                        <option value="OCCUPIED">Ocupada</option>
                        <option value="MAINTENANCE">Mantenimiento</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={isLoading} className="w-full md:w-auto">
                    {initialData ? "Actualizar Unidad" : "Crear Unidad"}
                </Button>
            </div>
        </form>
    );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { residentSchema, ResidentInput } from "@/lib/validations/resident";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Resident } from "@prisma/client";

interface ResidentFormProps {
    initialData?: Partial<Resident>;
    onSubmit: (data: ResidentInput) => Promise<void>;
    isLoading?: boolean;
    users?: { id: string, name: string, email: string }[];
    units?: { id: string, number: string, complex: { name: string } }[];
}

export function ResidentForm({ initialData, onSubmit, isLoading, users, units }: ResidentFormProps) {
    const emergency = (initialData?.emergencyContact as any) || {};

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(residentSchema),
        defaultValues: {
            userId: initialData?.userId || "",
            unitId: initialData?.unitId || "",
            type: (initialData?.type as any) || "TENANT",
            startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : undefined,
            emergencyContact: {
                name: emergency.name || "",
                phone: emergency.phone || "",
                relation: emergency.relation || "",
            },
        },
    });

    const onFormSubmit = async (data: any) => {
        await onSubmit(data as ResidentInput);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-8">
            <div className="space-y-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                    Asignación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Usuario
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("userId")}
                        >
                            <option value="">Seleccione un usuario</option>
                            {users?.map((u) => (
                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                            ))}
                        </select>
                        {errors.userId && (
                            <p className="text-xs text-red-500 mt-1">{errors.userId.message as string}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Unidad
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("unitId")}
                        >
                            <option value="">Seleccione una unidad</option>
                            {units?.map((u) => (
                                <option key={u.id} value={u.id}>Unidad {u.number} ({u.complex.name})</option>
                            ))}
                        </select>
                        {errors.unitId && (
                            <p className="text-xs text-red-500 mt-1">{errors.unitId.message as string}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Tipo de Residente
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("type")}
                        >
                            <option value="TENANT">Inquilino</option>
                            <option value="OWNER">Propietario</option>
                        </select>
                    </div>
                    <Input
                        label="Fecha de Inicio"
                        type="date"
                        {...register("startDate")}
                        error={errors.startDate?.message as string}
                    />
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                    Contacto de Emergencia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Nombre"
                        placeholder="Nombre del contacto"
                        {...register("emergencyContact.name")}
                        error={(errors.emergencyContact as any)?.name?.message}
                    />
                    <Input
                        label="Teléfono"
                        placeholder="Teléfono del contacto"
                        {...register("emergencyContact.phone")}
                        error={(errors.emergencyContact as any)?.phone?.message}
                    />
                    <Input
                        label="Parentesco"
                        placeholder="Ej: Padre, Esposa, etc."
                        {...register("emergencyContact.relation")}
                        error={(errors.emergencyContact as any)?.relation?.message}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={isLoading} className="w-full md:w-auto">
                    {initialData?.id ? "Actualizar Residente" : "Asignar Residente"}
                </Button>
            </div>
        </form>
    );
}

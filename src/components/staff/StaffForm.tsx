"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { staffCreateSchema, staffUpdateSchema } from "@/lib/validations/staff";
import { Button } from "@/components/ui/Button"; // Check path, usually components/ui
import { Role } from "@/types/roles";
import { useTranslations } from "next-intl";

interface StaffFormProps {
    initialData?: any; // StaffUser
    onSubmit: (data: any) => Promise<void>;
    isLoading?: boolean;
    isEditing?: boolean;
    complexes: { id: string; name: string }[];
    currentUserRole: Role;
}

export const StaffForm = ({ initialData, onSubmit, isLoading, isEditing, complexes, currentUserRole }: StaffFormProps) => {
    // Determine which schema to use based on isEditing
    // Actually, create schema has required password, update has optional
    // Let's use a dynamic schema or logic

    // For simplicity, we can pass correct schema to resolver
    const schema = isEditing ? staffUpdateSchema : staffCreateSchema;

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: initialData || {
            name: "",
            email: "",
            phone: "",
            role: Role.GUARD,
            status: "ACTIVE",
            password: "",
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nombre Completo
                    </label>
                    <input
                        {...register("name")}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Ej. Juan Pérez"
                    />
                    {errors.name && (
                        <p className="text-sm text-red-500 mt-1">{errors.name.message as string}</p>
                    )}
                </div>

                {!isEditing && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Correo Electrónico
                        </label>
                        <input
                            {...register("email")}
                            type="email"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="juan@ejemplo.com"
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500 mt-1">{errors.email.message as string}</p>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Teléfono
                    </label>
                    <input
                        {...register("phone")}
                        type="tel"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="+502 1234 5678"
                    />
                    {errors.phone && (
                        <p className="text-sm text-red-500 mt-1">{errors.phone.message as string}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Rol
                    </label>
                    <select
                        {...register("role")}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value={Role.GUARD}>Guardia de Seguridad</option>
                        <option value={Role.BOARD_OF_DIRECTORS}>Junta Directiva</option>
                        {currentUserRole === Role.SUPER_ADMIN && (
                            <>
                                <option value={Role.ADMIN}>Administrador</option>
                                <option value={Role.SUPER_ADMIN}>Súper Administrador</option>
                            </>
                        )}
                    </select>
                    {errors.role && (
                        <p className="text-sm text-red-500 mt-1">{errors.role.message as string}</p>
                    )}
                </div>

                {currentUserRole === Role.SUPER_ADMIN && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {watch("role") === Role.ADMIN || watch("role") === Role.SUPER_ADMIN ? "Complejo (Opcional)" : "Complejo (Requerido para Staff)"}
                        </label>
                        <select
                            {...register("complexId")}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">Seleccionar Complejo</option>
                            {complexes?.map((complex) => (
                                <option key={complex.id} value={complex.id}>
                                    {complex.name}
                                </option>
                            ))}
                        </select>
                        {errors.complexId && (
                            <p className="text-sm text-red-500 mt-1">{errors.complexId.message as string}</p>
                        )}
                    </div>
                )}

                {!isEditing && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Contraseña
                        </label>
                        <input
                            {...register("password")}
                            type="password"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="******"
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500 mt-1">{errors.password.message as string}</p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="secondary" onClick={() => { /* Handle cancel via parent? Or just type submit */ }}>
                    Cancelar
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    {isEditing ? "Guardar Cambios" : "Crear Usuario"}
                </Button>
            </div>
        </form>
    );
};

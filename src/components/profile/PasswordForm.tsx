"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";

export function PasswordForm() {
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        }
    });

    const newPassword = watch("newPassword");

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const response = await fetch("/api/users/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword,
                }),
            });

            if (response.ok) {
                toast.success("Contraseña actualizada");
                reset();
            } else {
                const text = await response.text();
                toast.error(text || "Error al actualizar");
            }
        } catch (error) {
            toast.error("Error al actualizar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contraseña Actual</label>
                    <Input
                        type="password"
                        {...register("currentPassword", { required: "Contraseña actual requerida" })}
                        error={errors.currentPassword?.message}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nueva Contraseña</label>
                        <Input
                            type="password"
                            {...register("newPassword", {
                                required: "Nueva contraseña requerida",
                                minLength: { value: 6, message: "Mínimo 6 caracteres" }
                            })}
                            error={errors.newPassword?.message}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar Nueva Contraseña</label>
                        <Input
                            type="password"
                            {...register("confirmPassword", {
                                required: "Confirmación requerida",
                                validate: value => value === newPassword || "Las contraseñas no coinciden"
                            })}
                            error={errors.confirmPassword?.message}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-start">
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? "Actualizando..." : "Cambiar Contraseña"}
                </Button>
            </div>
        </form>
    );
}

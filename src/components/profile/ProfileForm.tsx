"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface ProfileFormProps {
    user: {
        name: string;
        email: string;
        phone: string | null;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
        defaultValues: {
            name: user.name,
            phone: user.phone || "",
        }
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            const response = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success("Perfil actualizado");
                router.refresh();
            } else {
                toast.error("Error al actualizar");
            }
        } catch (error) {
            toast.error("Error al actualizar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombre Completo</label>
                    <Input
                        {...register("name", { required: "El nombre es requerido" })}
                        error={errors.name?.message}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Correo Electrónico</label>
                    <Input
                        value={user.email}
                        disabled
                        className="bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-not-allowed"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Teléfono</label>
                    <Input
                        {...register("phone")}
                        placeholder="Ej: +502 1234 5678"
                    />
                </div>
            </div>

            <div className="flex justify-start">
                <Button type="submit" disabled={loading || !isDirty}>
                    {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </div>
        </form>
    );
}

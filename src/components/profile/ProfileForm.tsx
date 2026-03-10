"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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
    const { update: updateSession } = useSession();

    const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm({
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
                // Update the NextAuth session so the sidebar name refreshes immediately
                await updateSession({ name: data.name });
                toast.success("Perfil actualizado correctamente");
                reset(data); // Reset dirty state so button disables again
                router.refresh();
            } else {
                const errorData = await response.json().catch(() => ({}));
                toast.error(errorData.error || "Error al actualizar el perfil");
            }
        } catch (error) {
            toast.error("Error de conexión. Intenta de nuevo.");
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
                        className="bg-slate-50 dark:bg-background-dark text-slate-500 cursor-not-allowed"
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
                <Button type="submit" isLoading={loading} disabled={loading || !isDirty}>
                    {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </div>
        </form>
    );
}

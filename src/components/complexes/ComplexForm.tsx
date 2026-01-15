"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ComplexCreateSchema, ComplexCreateInput } from "@/lib/validations/complex";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ComplexType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";

interface ComplexFormProps {
    initialData?: Partial<ComplexCreateInput>;
    id?: string;
    isEditing?: boolean;
}

export function ComplexForm({ initialData, id, isEditing }: ComplexFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm<ComplexCreateInput>({
        resolver: zodResolver(ComplexCreateSchema) as any,
        defaultValues: (initialData as any) || {
            type: ComplexType.BUILDING,
        },
    });

    const onSubmit = async (data: ComplexCreateInput) => {
        setLoading(true);
        setError(null);
        try {
            const url = isEditing ? `/api/complexes/${id}` : "/api/complexes";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al guardar el complejo");
            }

            router.push("/dashboard/complexes");
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
            {error && <Alert variant="error" title="Error">{error}</Alert>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Nombre del Complejo
                    </label>
                    <Input
                        {...register("name")}
                        error={errors.name?.message}
                        placeholder="Ej: Torres del Sol"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Dirección
                    </label>
                    <Input
                        {...register("address")}
                        error={errors.address?.message}
                        placeholder="Dirección completa"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Tipo de Complejo
                    </label>
                    <Select
                        {...register("type")}
                        options={[
                            { label: "Edificio", value: ComplexType.BUILDING },
                            { label: "Residencial", value: ComplexType.RESIDENTIAL },
                            { label: "Condominio", value: ComplexType.CONDO },
                        ]}
                        error={errors.type?.message}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        URL del Logo (Opcional)
                    </label>
                    <Input
                        {...register("logoUrl")}
                        error={errors.logoUrl?.message}
                        placeholder="https://ejemplo.com/logo.png"
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.back()}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? "Guardando..." : isEditing ? "Actualizar Complejo" : "Crear Complejo"}
                </Button>
            </div>
        </form>
    );
}

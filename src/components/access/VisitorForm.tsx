"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { visitorLogSchema, type VisitorLogInput } from "@/lib/validations/visitor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";

interface VisitorFormProps {
    unitId: string;
    complexId: string;
    onSuccess?: () => void;
}

export function VisitorForm({ unitId, complexId, onSuccess }: VisitorFormProps) {
    const t = useTranslations("AccessControl");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<VisitorLogInput>({
        resolver: zodResolver(visitorLogSchema),
        defaultValues: {
            unitId,
            complexId,
            status: "SCHEDULED",
            scheduledDate: new Date().toISOString().split("T")[0],
        },
    });

    const onSubmit = async (data: VisitorLogInput) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/visitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!response.ok) throw new Error("Failed to save");

            toast.success(t("successSave"));
            reset();
            if (onSuccess) onSuccess();
            router.refresh();
        } catch (error) {
            console.error(error);
            toast.error(t("errorSaving"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label={t("visitorName")}
                    {...register("visitorName")}
                    error={errors.visitorName?.message}
                    placeholder="Ej. Juan Pérez"
                />
                <Input
                    label={t("visitorId")}
                    {...register("visitorId")}
                    error={errors.visitorId?.message}
                    placeholder="DPI / Pasaporte"
                />
            </div>

            <Input
                label={t("scheduledDate")}
                type="date"
                {...register("scheduledDate")}
                error={errors.scheduledDate?.message}
            />

            <Input
                label={t("reason")}
                {...register("reason")}
                error={errors.reason?.message}
                placeholder="Ej. Visita familiar, Entrega de paquete"
            />

            <div className="flex justify-end gap-3 pt-4">
                <Button type="submit" isLoading={isLoading} icon="save">
                    {t("newVisitor")}
                </Button>
            </div>
        </form>
    );
}

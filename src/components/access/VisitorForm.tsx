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
        watch,
        formState: { errors },
    } = useForm<VisitorLogInput>({
        resolver: zodResolver(visitorLogSchema),
        defaultValues: {
            unitId,
            complexId,
            status: "SCHEDULED",
            arrivesInVehicle: false,
            scheduledDate: new Date().toISOString().split("T")[0],
        },
    });
    const arrivesInVehicle = watch("arrivesInVehicle");
    const normalizePlateForInput = (value: string): string =>
        value.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9-]/g, "");

    const onSubmit = async (data: VisitorLogInput) => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/visitors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            const payload = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(payload?.error?.message || t("errorSaving"));
            }

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
                    placeholder={t("visitorNamePlaceholder")}
                />
                <Input
                    label={t("visitorId")}
                    {...register("visitorId")}
                    error={errors.visitorId?.message}
                    placeholder={t("visitorIdPlaceholder")}
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
                placeholder={t("reasonPlaceholder")}
            />

            <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <input
                        type="checkbox"
                        {...register("arrivesInVehicle")}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                    />
                    {t("arrivesInVehicle")}
                </label>

                {arrivesInVehicle && (
                    <Input
                        label={t("vehiclePlate")}
                        {...register("vehiclePlate")}
                        onInput={(event) => {
                            const target = event.target as HTMLInputElement;
                            target.value = normalizePlateForInput(target.value);
                        }}
                        error={errors.vehiclePlate?.message}
                        placeholder={t("vehiclePlatePlaceholder")}
                    />
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="submit" isLoading={isLoading} icon="save">
                    {t("newVisitor")}
                </Button>
            </div>
        </form>
    );
}

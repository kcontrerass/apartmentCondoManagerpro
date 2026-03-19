"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { residentSchema, ResidentInput } from "@/lib/validations/resident";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Resident } from "@prisma/client";
import { useTranslations } from "next-intl";

interface ResidentFormProps {
    initialData?: Partial<Resident>;
    onSubmit: (data: ResidentInput) => Promise<void>;
    isLoading?: boolean;
    users?: { id: string, name: string, email: string }[];
    units?: { id: string, number: string, complex: { name: string } }[];
}

export function ResidentForm({ initialData, onSubmit, isLoading, users, units }: ResidentFormProps) {
    const t = useTranslations("Residents");
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
                    {t("form.assignment")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {t("form.user")}
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("userId")}
                        >
                            <option value="">{t("form.selectUser")}</option>
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
                            {t("form.unit")}
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("unitId")}
                        >
                            <option value="">{t("form.selectUnit")}</option>
                            {units?.map((u) => (
                                <option key={u.id} value={u.id}>{t("form.unitOption", { number: u.number, complex: u.complex.name })}</option>
                            ))}
                        </select>
                        {errors.unitId && (
                            <p className="text-xs text-red-500 mt-1">{errors.unitId.message as string}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {t("form.residentType")}
                        </label>
                        <select
                            className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            {...register("type")}
                        >
                            <option value="TENANT">{t("form.typeTenant")}</option>
                            <option value="OWNER">{t("form.typeOwner")}</option>
                        </select>
                        {errors.type && (
                            <p className="text-xs text-red-500 mt-1">{errors.type.message as string}</p>
                        )}
                    </div>
                    <Input
                        label={t("form.startDate")}
                        type="date"
                        {...register("startDate")}
                        error={errors.startDate?.message as string}
                    />
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                    {t("form.emergencySection")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label={t("form.name")}
                        placeholder={t("form.contactNamePlaceholder")}
                        {...register("emergencyContact.name")}
                        error={(errors.emergencyContact as any)?.name?.message}
                    />
                    <Input
                        label={t("form.phone")}
                        placeholder={t("form.contactPhonePlaceholder")}
                        {...register("emergencyContact.phone")}
                        error={(errors.emergencyContact as any)?.phone?.message}
                    />
                    <Input
                        label={t("form.relation")}
                        placeholder={t("form.relationPlaceholder")}
                        {...register("emergencyContact.relation")}
                        error={(errors.emergencyContact as any)?.relation?.message}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={isLoading} className="w-full md:w-auto">
                    {initialData?.id ? t("form.updateResident") : t("form.assignResident")}
                </Button>
            </div>
        </form>
    );
}

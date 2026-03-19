"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { staffCreateSchema, staffUpdateSchema, StaffCreateData, StaffUpdateData } from "@/lib/validations/staff";
import { Button } from "@/components/ui/Button"; // Check path, usually components/ui
import { Role } from "@/types/roles";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface StaffFormProps {
    initialData?: Partial<StaffCreateData & StaffUpdateData>; // StaffUser
    onSubmit: (data: StaffCreateData | StaffUpdateData) => Promise<void>;
    onCancel?: () => void;
    isLoading?: boolean;
    isEditing?: boolean;
    complexes: { id: string; name: string }[];
    currentUserRole: Role;
}

export const StaffForm = ({ initialData, onSubmit, onCancel, isLoading, isEditing, complexes, currentUserRole }: StaffFormProps) => {
    const t = useTranslations("Staff");
    // Determine which schema to use based on isEditing
    // Actually, create schema has required password, update has optional
    // Let's use a dynamic schema or logic

    // For simplicity, we can pass correct schema to resolver
    const editingSchema = staffUpdateSchema.extend({
        confirmPassword: z.string().optional(),
    }).refine((data) => {
        if (!data.password) return true;
        return data.password === data.confirmPassword;
    }, {
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
    });

    const schema = isEditing ? editingSchema : staffCreateSchema;
    const [changePassword, setChangePassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(schema) as any,
        defaultValues: initialData || {
            name: "",
            email: "",
            phone: "",
            role: Role.GUARD,
            status: "ACTIVE",
            password: "",
        },
    });

    const handleFormSubmit = async (data: StaffUpdateData & { confirmPassword?: string }) => {
        const payload = { ...data };

        if (!isEditing) {
            await onSubmit(payload as StaffCreateData);
            return;
        }

        if (!changePassword) {
            delete payload.password;
            delete payload.confirmPassword;
            await onSubmit(payload as StaffUpdateData);
            return;
        }

        if (!payload.password) {
            return;
        }

        delete payload.confirmPassword;
        await onSubmit(payload as StaffUpdateData);
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t("fullName")}
                    </label>
                    <input
                        {...register("name")}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder={t("fullNamePlaceholder")}
                    />
                    {errors.name && (
                        <p className="text-sm text-red-500 mt-1">{errors.name.message as string}</p>
                    )}
                </div>

                {!isEditing && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {t("email")}
                        </label>
                        <input
                            {...register("email")}
                            type="email"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder={t("emailPlaceholder")}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500 mt-1">{errors.email.message as string}</p>
                        )}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t("phone")}
                    </label>
                    <input
                        {...register("phone")}
                        type="tel"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder={t("phonePlaceholder")}
                    />
                    {errors.phone && (
                        <p className="text-sm text-red-500 mt-1">{errors.phone.message as string}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t("role")}
                    </label>
                    <select
                        {...register("role")}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value={Role.GUARD}>{t("roleGuard")}</option>
                        <option value={Role.BOARD_OF_DIRECTORS}>{t("roleBoard")}</option>
                        {currentUserRole === Role.SUPER_ADMIN && (
                            <>
                                <option value={Role.ADMIN}>{t("roleAdmin")}</option>
                                <option value={Role.SUPER_ADMIN}>{t("roleSuperAdmin")}</option>
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
                            {watch("role") === Role.ADMIN || watch("role") === Role.SUPER_ADMIN ? t("complexOptional") : t("complexRequired")}
                        </label>
                        <select
                            {...register("complexId")}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">{t("selectComplex")}</option>
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
                            {t("password")}
                        </label>
                        <input
                            {...register("password")}
                            type="password"
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder={t("passwordPlaceholder")}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500 mt-1">{errors.password.message as string}</p>
                        )}
                    </div>
                )}

                {isEditing && (
                    <div className="space-y-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Contraseña del empleado</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t("passwordSectionHelp")}</p>
                            </div>
                            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={changePassword}
                                    onChange={(e) => setChangePassword(e.target.checked)}
                                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                                />
                                {t("changePassword")}
                            </label>
                        </div>

                        {changePassword && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        {t("newPassword")}
                                    </label>
                                    <input
                                        {...register("password")}
                                        type="password"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder={t("newPasswordPlaceholder")}
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-red-500 mt-1">{errors.password.message as string}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        {t("confirmPassword")}
                                    </label>
                                    <input
                                        {...register("confirmPassword")}
                                        type="password"
                                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder={t("confirmPasswordPlaceholder")}
                                    />
                                    {errors.confirmPassword && (
                                        <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message as string}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="secondary" onClick={onCancel}>
                    {t("cancel")}
                </Button>
                <Button type="submit" isLoading={isLoading}>
                    {isEditing ? t("saveChanges") : t("createUser")}
                </Button>
            </div>
        </form>
    );
};

"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";

export function PasswordForm() {
    const t = useTranslations("Profile");
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
                toast.success(t("password.updated"));
                reset();
            } else {
                const text = await response.text();
                toast.error(text || t("password.error"));
            }
        } catch (error) {
            toast.error(t("password.error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("password.currentLabel")}</label>
                    <Input
                        type="password"
                        {...register("currentPassword", { required: t("password.currentRequired") })}
                        error={errors.currentPassword?.message}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("password.newLabel")}</label>
                        <Input
                            type="password"
                            {...register("newPassword", {
                                required: t("password.newRequired"),
                                minLength: { value: 6, message: t("password.minLength") }
                            })}
                            error={errors.newPassword?.message}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("password.confirmLabel")}</label>
                        <Input
                            type="password"
                            {...register("confirmPassword", {
                                required: t("password.confirmRequired"),
                                validate: value => value === newPassword || t("password.mismatch")
                            })}
                            error={errors.confirmPassword?.message}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-start">
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? t("password.updating") : t("password.changeButton")}
                </Button>
            </div>
        </form>
    );
}

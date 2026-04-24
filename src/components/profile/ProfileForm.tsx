"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Role } from "@/types/roles";

interface ProfileFormProps {
    user: {
        name: string;
        email: string;
        phone: string | null;
        role: string;
    };
}

export function ProfileForm({ user }: ProfileFormProps) {
    const t = useTranslations("Profile");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { update: updateSession } = useSession();

    const canEditEmail = user.role === Role.SUPER_ADMIN;

    const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm({
        defaultValues: {
            name: user.name,
            email: user.email,
            phone: user.phone || "",
        }
    });

    const onSubmit = async (data: { name: string; email: string; phone: string }) => {
        setLoading(true);
        try {
            const payload: { name: string; phone: string; email?: string } = {
                name: data.name,
                phone: data.phone,
            };
            if (canEditEmail) {
                payload.email = data.email.trim().toLowerCase();
            }

            const response = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                await updateSession(
                    canEditEmail
                        ? { name: data.name, email: data.email.trim().toLowerCase() }
                        : { name: data.name }
                );
                toast.success(t("form.updatedSuccess"));
                reset({ ...data, email: canEditEmail ? data.email.trim().toLowerCase() : data.email });
                router.refresh();
            } else {
                const errorData = await response.json().catch(() => ({}));
                toast.error(
                    (typeof errorData.error === "string" && errorData.error) || t("form.updateError")
                );
            }
        } catch {
            toast.error(t("form.connectionError"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("form.nameLabel")}</label>
                    <Input
                        {...register("name", { required: t("form.nameRequired") })}
                        error={errors.name?.message}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("form.emailLabel")}
                    </label>
                    {canEditEmail ? (
                        <>
                            <Input
                                type="email"
                                autoComplete="email"
                                {...register("email", {
                                    required: t("form.emailRequired"),
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: t("form.emailInvalid"),
                                    },
                                })}
                                error={errors.email?.message}
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {t("form.emailSuperAdminHint")}
                            </p>
                        </>
                    ) : (
                        <Input
                            value={user.email}
                            disabled
                            readOnly
                            className="bg-slate-50 dark:bg-background-dark text-slate-500 cursor-not-allowed"
                        />
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t("form.phoneLabel")}</label>
                    <Input
                        {...register("phone")}
                        placeholder={t("form.phonePlaceholder")}
                    />
                </div>
            </div>

            <div className="flex justify-start">
                <Button type="submit" isLoading={loading} disabled={loading || !isDirty}>
                    {loading ? t("form.saving") : t("form.saveChanges")}
                </Button>
            </div>
        </form>
    );
}

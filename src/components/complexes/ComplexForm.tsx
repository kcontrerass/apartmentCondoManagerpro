"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ComplexCreateSchema, ComplexCreateInput } from "@/lib/validations/complex";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ComplexType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Alert } from "@/components/ui/Alert";
import { useTranslations } from "next-intl";

interface ComplexFormProps {
    initialData?: Partial<ComplexCreateInput>;
    id?: string;
    isEditing?: boolean;
}

export function ComplexForm({ initialData, id, isEditing }: ComplexFormProps) {
    const t = useTranslations("Complexes");
    const tCommon = useTranslations("Common");
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [admins, setAdmins] = useState<{ id: string; name: string }[]>([]);

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
            adminId: "",
        },
    });

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                let url = "/api/users/admins?unassigned=true";
                if (isEditing && id) {
                    url += `&currentComplexId=${id}`;
                }
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    setAdmins(data);
                }
            } catch (error) {
                console.error("Error fetching admins", error);
            }
        }
        fetchAdmins();
    }, [isEditing, id]);

    const onSubmit = async (data: ComplexCreateInput) => {
        setLoading(true);
        setError(null);
        try {
            const payload = { ...data };

            const url = isEditing ? `/api/complexes/${id}` : "/api/complexes";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t("form.errorSave"));
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
            {error && <Alert variant="error" title={tCommon("error")}>{error}</Alert>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        {t("form.complexName")}
                    </label>
                    <Input
                        {...register("name")}
                        error={errors.name?.message}
                        placeholder={t("form.namePlaceholder")}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        {t("form.address")}
                    </label>
                    <Input
                        {...register("address")}
                        error={errors.address?.message}
                        placeholder={t("form.addressPlaceholder")}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        {t("form.bankAccount")}
                    </label>
                    <Input
                        {...register("bankAccount")}
                        error={errors.bankAccount?.message}
                        placeholder={t("form.bankPlaceholder")}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        {t("form.phone")}
                    </label>
                    <Input
                        {...register("phone")}
                        error={errors.phone?.message}
                        placeholder={t("form.phonePlaceholder")}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        {t("form.complexType")}
                    </label>
                    <Select
                        {...register("type")}
                        options={[
                            { label: t("types.BUILDING" as never), value: ComplexType.BUILDING },
                            { label: t("types.CONDO" as never), value: ComplexType.CONDO },
                            { label: t("types.SHOPPING_CENTER" as never), value: ComplexType.SHOPPING_CENTER },
                        ]}
                        error={errors.type?.message}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        {t("form.administrator")}
                    </label>
                    <Select
                        {...register("adminId")}
                        options={[
                            { label: t("form.selectAdmin"), value: "" },
                            ...admins.map((admin) => ({
                                label: admin.name,
                                value: admin.id,
                            })),
                        ]}
                        error={errors.adminId?.message}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                        {t("form.adminHelp")}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        {t("form.logoUrl")}
                    </label>
                    <Input
                        {...register("logoUrl")}
                        error={errors.logoUrl?.message}
                        placeholder={t("form.logoPlaceholder")}
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
                    {t("form.cancel")}
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                    {loading ? t("form.saving") : isEditing ? t("form.updateComplex") : t("form.createComplex")}
                </Button>
            </div>
        </form>
    );
}

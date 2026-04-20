"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { residentAirbnbSelfSchema, ResidentAirbnbSelfInput } from "@/lib/validations/resident";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

function toDateInput(d: Date | string | null | undefined) {
    if (!d) return "";
    return new Date(d).toISOString().split("T")[0];
}

export interface ResidentAirbnbFormInitial {
    isAirbnb: boolean;
    airbnbStartDate: Date | string | null;
    airbnbEndDate: Date | string | null;
    airbnbGuestName: string | null;
    airbnbReservationCode: string | null;
    airbnbGuestPhone: string | null;
    airbnbGuestIdentification: string | null;
}

interface ResidentAirbnbFormProps {
    initial: ResidentAirbnbFormInitial;
}

export function ResidentAirbnbForm({ initial }: ResidentAirbnbFormProps) {
    const t = useTranslations("Residents");
    const tProfile = useTranslations("Profile");
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isDirty },
        reset,
    } = useForm({
        resolver: zodResolver(residentAirbnbSelfSchema),
        defaultValues: {
            isAirbnb: initial.isAirbnb,
            airbnbStartDate: toDateInput(initial.airbnbStartDate),
            airbnbEndDate: toDateInput(initial.airbnbEndDate),
            airbnbGuestName: initial.airbnbGuestName ?? "",
            airbnbReservationCode: initial.airbnbReservationCode ?? "",
            airbnbGuestPhone: initial.airbnbGuestPhone ?? "",
            airbnbGuestIdentification: initial.airbnbGuestIdentification ?? "",
        },
    });

    const initialSyncKey = [
        initial.isAirbnb,
        toDateInput(initial.airbnbStartDate),
        toDateInput(initial.airbnbEndDate),
        initial.airbnbGuestName ?? "",
        initial.airbnbReservationCode ?? "",
        initial.airbnbGuestPhone ?? "",
        initial.airbnbGuestIdentification ?? "",
    ].join("|");

    useEffect(() => {
        reset({
            isAirbnb: initial.isAirbnb,
            airbnbStartDate: toDateInput(initial.airbnbStartDate),
            airbnbEndDate: toDateInput(initial.airbnbEndDate),
            airbnbGuestName: initial.airbnbGuestName ?? "",
            airbnbReservationCode: initial.airbnbReservationCode ?? "",
            airbnbGuestPhone: initial.airbnbGuestPhone ?? "",
            airbnbGuestIdentification: initial.airbnbGuestIdentification ?? "",
        });
    }, [initialSyncKey, reset]); // eslint-disable-line react-hooks/exhaustive-deps -- initialSyncKey mirrors `initial`

    const isAirbnb = watch("isAirbnb");

    const clearAirbnbFields = () => {
        setValue("airbnbStartDate", "", { shouldDirty: true });
        setValue("airbnbEndDate", "", { shouldDirty: true });
        setValue("airbnbGuestName", "", { shouldDirty: true });
        setValue("airbnbReservationCode", "", { shouldDirty: true });
        setValue("airbnbGuestPhone", "", { shouldDirty: true });
        setValue("airbnbGuestIdentification", "", { shouldDirty: true });
    };

    const onSubmit = async (data: ResidentAirbnbSelfInput) => {
        setLoading(true);
        try {
            const response = await fetch("/api/residents/me/airbnb", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success(tProfile("airbnb.savedSuccess"));
                router.refresh();
            } else {
                const err = await response.json().catch(() => ({}));
                toast.error(typeof err.error === "string" ? err.error : tProfile("airbnb.saveError"));
            }
        } catch {
            toast.error(tProfile("airbnb.connectionError"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">{tProfile("airbnb.description")}</p>

            <label className="flex items-start gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    className="mt-1 rounded border-slate-300 dark:border-slate-600"
                    {...register("isAirbnb", {
                        onChange: (e) => {
                            if (!e.target.checked) clearAirbnbFields();
                        },
                    })}
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">{t("form.airbnbCheckbox")}</span>
            </label>

            {isAirbnb && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <Input
                        label={t("form.airbnbStartDate")}
                        type="date"
                        {...register("airbnbStartDate")}
                        error={errors.airbnbStartDate?.message as string}
                    />
                    <Input
                        label={t("form.airbnbEndDate")}
                        type="date"
                        {...register("airbnbEndDate")}
                        error={errors.airbnbEndDate?.message as string}
                    />
                    <Input
                        label={t("form.airbnbGuestName")}
                        placeholder={t("form.airbnbGuestNamePlaceholder")}
                        {...register("airbnbGuestName")}
                        error={errors.airbnbGuestName?.message as string}
                    />
                    <Input
                        label={t("form.airbnbGuestIdentification")}
                        placeholder={t("form.airbnbGuestIdentificationPlaceholder")}
                        {...register("airbnbGuestIdentification")}
                        error={errors.airbnbGuestIdentification?.message as string}
                    />
                    <Input
                        label={t("form.airbnbReservationCode")}
                        placeholder={t("form.airbnbReservationCodePlaceholder")}
                        {...register("airbnbReservationCode")}
                        error={errors.airbnbReservationCode?.message as string}
                    />
                    <Input
                        label={t("form.airbnbGuestPhone")}
                        placeholder={t("form.airbnbGuestPhonePlaceholder")}
                        {...register("airbnbGuestPhone")}
                        error={errors.airbnbGuestPhone?.message as string}
                    />
                </div>
            )}

            <div className="flex justify-end pt-2">
                <Button type="submit" isLoading={loading} disabled={!isDirty} className="w-full md:w-auto">
                    {tProfile("airbnb.save")}
                </Button>
            </div>
        </form>
    );
}

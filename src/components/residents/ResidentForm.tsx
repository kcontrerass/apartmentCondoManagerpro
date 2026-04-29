"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { residentSchema, ResidentInput } from "@/lib/validations/resident";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Resident } from "@prisma/client";
import { useTranslations } from "next-intl";
import { unitAllowsAirbnbGuestResident } from "@/lib/resident-type-eligibility";

interface ResidentFormProps {
    initialData?: Partial<Resident>;
    onSubmit: (data: ResidentInput) => Promise<void>;
    isLoading?: boolean;
    users?: { id: string; name: string; email: string }[];
    units?: {
        id: string;
        number: string;
        type?: string | null;
        complex: { name: string; type?: string | null };
    }[];
    /** When false, Airbnb fields are hidden and forced off on submit state. Default true. */
    airbnbGuestsEnabled?: boolean;
    /** Tipo de complejo del alcance (GET /api/complexes/:id); necesario para SHOPPING_CENTER aunque falte nested complex.type en unidades */
    complexTypeHint?: string | null;
}

function toDateInput(d: Date | string | null | undefined) {
    if (!d) return "";
    return new Date(d).toISOString().split("T")[0];
}

export function ResidentForm({
    initialData,
    onSubmit,
    isLoading,
    users,
    units,
    airbnbGuestsEnabled = true,
    complexTypeHint,
}: ResidentFormProps) {
    const t = useTranslations("Residents");
    const emergency = (initialData?.emergencyContact as any) || {};

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(residentSchema),
        defaultValues: {
            userId: initialData?.userId || "",
            unitId: initialData?.unitId || "",
            type: (initialData?.type as any) || "TENANT",
            startDate: initialData?.startDate
                ? new Date(initialData.startDate).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0],
            endDate: toDateInput(initialData?.endDate as Date | undefined),
            emergencyContact: {
                name: emergency.name || "",
                phone: emergency.phone || "",
                relation: emergency.relation || "",
            },
            isAirbnb: initialData?.isAirbnb ?? false,
            airbnbStartDate: toDateInput(initialData?.airbnbStartDate as Date | undefined),
            airbnbEndDate: toDateInput(initialData?.airbnbEndDate as Date | undefined),
            airbnbGuestName: initialData?.airbnbGuestName ?? "",
            airbnbReservationCode: initialData?.airbnbReservationCode ?? "",
            airbnbGuestPhone: initialData?.airbnbGuestPhone ?? "",
            airbnbGuestIdentification: initialData?.airbnbGuestIdentification ?? "",
        },
    });

    const watchedUnitId = watch("unitId");
    const selectedUnit = units?.find((u) => u.id === watchedUnitId);

    const initialUnit = (initialData as { unit?: { type?: string | null; complex?: { type?: string | null } } })
        ?.unit;

    const resolvedComplexType =
        complexTypeHint ??
        selectedUnit?.complex?.type ??
        initialUnit?.complex?.type ??
        undefined;

    const resolvedUnitType =
        selectedUnit?.type ?? initialUnit?.type ?? null;

    const unitEligibleAirbnb = unitAllowsAirbnbGuestResident(
        resolvedComplexType ?? "",
        resolvedUnitType,
    );

    const effectiveAirbnbGuestsEnabled = Boolean(
        airbnbGuestsEnabled && unitEligibleAirbnb,
    );

    const residentType = watch("type");
    const isAirbnb = watch("isAirbnb");
    const prevTypeRef = useRef<string | undefined>(undefined);

    const clearAirbnbFields = () => {
        setValue("airbnbStartDate", "");
        setValue("airbnbEndDate", "");
        setValue("airbnbGuestName", "");
        setValue("airbnbReservationCode", "");
        setValue("airbnbGuestPhone", "");
        setValue("airbnbGuestIdentification", "");
    };

    useEffect(() => {
        if (!airbnbGuestsEnabled) {
            setValue("isAirbnb", false);
            clearAirbnbFields();
        }
    }, [airbnbGuestsEnabled, setValue]);

    useEffect(() => {
        if (!effectiveAirbnbGuestsEnabled) {
            if (residentType === "AIRBNB_GUEST") {
                setValue("type", "TENANT");
            }
            setValue("isAirbnb", false);
            clearAirbnbFields();
        }
    }, [effectiveAirbnbGuestsEnabled, residentType, setValue]);

    useEffect(() => {
        if (residentType === "AIRBNB_GUEST") {
            setValue("isAirbnb", true);
        }
    }, [residentType, setValue]);

    useEffect(() => {
        if (prevTypeRef.current === undefined) {
            prevTypeRef.current = residentType;
            return;
        }
        if (prevTypeRef.current === "AIRBNB_GUEST" && residentType !== "AIRBNB_GUEST") {
            setValue("isAirbnb", false);
            clearAirbnbFields();
        }
        prevTypeRef.current = residentType;
    }, [residentType, setValue]);

    const showAirbnbCheckbox = residentType !== "AIRBNB_GUEST";
    const showAirbnbFieldGrid = residentType === "AIRBNB_GUEST" || isAirbnb;

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
                                <option key={u.id} value={u.id}>
                                    {u.name} ({u.email})
                                </option>
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
                                <option key={u.id} value={u.id}>
                                    {t("form.unitOption", { number: u.number, complex: u.complex.name })}
                                </option>
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
                            {unitEligibleAirbnb ? (
                                <option value="AIRBNB_GUEST">{t("form.typeAirbnbGuest")}</option>
                            ) : null}
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

            {airbnbGuestsEnabled &&
                selectedUnit &&
                !unitAllowsAirbnbGuestResident(
                    resolvedComplexType ?? selectedUnit.complex?.type ?? "",
                    selectedUnit.type,
                ) && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2">
                        {t("form.airbnbNotApplicableUnit")}
                    </p>
                )}

            {effectiveAirbnbGuestsEnabled && (
                <div className="space-y-6">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
                        {t("form.airbnbSection")}
                    </h3>
                    {showAirbnbCheckbox && (
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
                    )}
                    {residentType === "AIRBNB_GUEST" && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t("form.airbnbGuestTypeHint")}</p>
                    )}

                    {showAirbnbFieldGrid && (
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
                </div>
            )}

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

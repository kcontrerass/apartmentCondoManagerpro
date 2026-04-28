"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    unitSchema,
    UnitInput,
    buildUnitNumbersFromPrefix,
    UNIT_BATCH_MAX,
    UnitBatchInput,
} from "@/lib/validations/unit";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Unit } from "@prisma/client";

interface UnitFormProps {
    initialData?: Partial<Unit>;
    onSubmit: (data: UnitInput) => Promise<void>;
    /** Al crear, permite enviar un lote con los mismos datos por cada número. */
    onSubmitBatch?: (data: UnitBatchInput) => Promise<void>;
    isLoading?: boolean;
    complexes?: { id: string, name: string, type?: string }[];
    showComplexSelector?: boolean;
    complexId?: string | null;
}

const FREQ_KEYS: Record<string, "frequencyOnce" | "frequencyDaily" | "frequencyWeekly" | "frequencyMonthly" | "frequencyYearly"> = {
    ONCE: "frequencyOnce",
    DAILY: "frequencyDaily",
    WEEKLY: "frequencyWeekly",
    MONTHLY: "frequencyMonthly",
    YEARLY: "frequencyYearly",
};

const unitSchemaSingleCreate = unitSchema;
const unitSchemaBulk = unitSchema.omit({ number: true });

type UnitFormBodyProps = UnitFormProps & {
    bulkMode: boolean;
    bulkCount: number;
    onBulkCountChange: (n: number) => void;
    bulkNamePrefix: string;
    onBulkNamePrefixChange: (v: string) => void;
    listError: string;
    setListError: (v: string) => void;
};

function UnitFormBody({
    initialData,
    onSubmit,
    onSubmitBatch,
    isLoading,
    complexes,
    showComplexSelector,
    complexId,
    bulkMode,
    bulkCount,
    onBulkCountChange,
    bulkNamePrefix,
    onBulkNamePrefixChange,
    listError,
    setListError,
}: UnitFormBodyProps) {
    const t = useTranslations("Units");
    const tf = useTranslations("Services");
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);

    const schema = useMemo(
        () => (bulkMode && !initialData ? unitSchemaBulk : unitSchemaSingleCreate),
        [bulkMode, initialData]
    );

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(schema as any),
        defaultValues: {
            number: initialData?.number || "",
            type: initialData?.type || "Apartamento",
            bedrooms: initialData?.bedrooms || 1,
            bathrooms: initialData?.bathrooms || 1,
            area: initialData?.area || 0,
            parkingSpots: (initialData as any)?.parkingSpots ?? 0,
            status: initialData?.status || "VACANT",
            complexId: (initialData as any)?.complexId || (complexId || ""),
            serviceIds: [],
        },
    });

    const watchedComplexId = useWatch({
        control,
        name: "complexId",
    });

    useEffect(() => {
        if (complexId) {
            setValue("complexId", complexId);
        }
    }, [complexId, setValue]);

    useEffect(() => {
        const idToUse = complexId || watchedComplexId || (initialData as any)?.complexId;

        if (idToUse) {
            const fetchServices = async () => {
                setIsLoadingServices(true);
                try {
                    const response = await fetch(`/api/services?complexId=${idToUse}&isRequired=false`);
                    const data = await response.json();
                    if (response.ok) {
                        setAvailableServices(data);
                    }
                } catch (error) {
                    console.error("Error fetching services:", error);
                } finally {
                    setIsLoadingServices(false);
                }
            };
            fetchServices();
        } else {
            setAvailableServices([]);
        }
    }, [watchedComplexId, initialData]);

    const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({});

    const onFormSubmit = async (data: any) => {
        const selectedServiceIds = data.serviceIds || [];
        const services = selectedServiceIds.map((id: string) => ({
            id,
            quantity: serviceQuantities[id] || 1
        }));

        const finalData = {
            ...data,
            bedrooms: isNaN(data.bedrooms) || data.bedrooms === "" ? 1 : Number(data.bedrooms),
            bathrooms: isNaN(data.bathrooms) || data.bathrooms === "" ? 1 : Number(data.bathrooms),
            parkingSpots: isNaN(data.parkingSpots) || data.parkingSpots === "" ? 0 : Number(data.parkingSpots),
            area: isNaN(data.area) || data.area === "" ? undefined : Number(data.area),
            services
        };

        if (bulkMode && onSubmitBatch && !initialData) {
            setListError("");
            if (!String(bulkNamePrefix).trim()) {
                setListError(t("form.batchNameEmpty"));
                return;
            }
            if (bulkCount < 1 || bulkCount > UNIT_BATCH_MAX || !Number.isFinite(bulkCount)) {
                setListError(t("form.batchCountInvalid"));
                return;
            }
            const numbers = buildUnitNumbersFromPrefix(bulkNamePrefix, bulkCount);
            if (numbers.length === 0) {
                setListError(t("form.batchNameEmpty"));
                return;
            }
            const idToUse = complexId || data.complexId;
            if (showComplexSelector && !idToUse) {
                setListError(t("form.batchComplexRequired"));
                return;
            }
            if (!idToUse) {
                setListError(t("form.batchComplexRequired"));
                return;
            }
            await onSubmitBatch({
                complexId: idToUse,
                numbers,
                type: finalData.type,
                bedrooms: finalData.bedrooms,
                bathrooms: finalData.bathrooms,
                parkingSpots: finalData.parkingSpots,
                area: finalData.area,
                status: finalData.status,
                serviceIds: data.serviceIds,
                services: finalData.services,
            });
            return;
        }

        await onSubmit(finalData as UnitInput);
    };

    const onError = (errors: any) => {
        console.log("Form validation errors:", errors);
    };

    const handleQuantityChange = (serviceId: string, val: string) => {
        const qty = parseInt(val) || 1;
        setServiceQuantities(prev => ({
            ...prev,
            [serviceId]: qty
        }));
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit, onError)} className="space-y-6">
            {showComplexSelector && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("form.complex")}
                    </label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        {...register("complexId")}
                    >
                        <option value="">{t("form.selectComplex")}</option>
                        {complexes?.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    {(errors as any).complexId && (
                        <p className="text-xs text-red-500 mt-1">{(errors as any).complexId.message}</p>
                    )}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bulkMode && !initialData ? (
                    <div className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {t("form.batchCountLabel")}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={UNIT_BATCH_MAX}
                                    className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                    value={Number.isFinite(bulkCount) ? bulkCount : 1}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value, 10);
                                        onBulkCountChange(Number.isFinite(v) ? v : 1);
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {t("form.batchNameLabel")}
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                                    placeholder={t("form.batchNamePlaceholder")}
                                    value={bulkNamePrefix}
                                    onChange={(e) => onBulkNamePrefixChange(e.target.value)}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500">
                            {t("form.batchNameHint", { max: UNIT_BATCH_MAX })}
                        </p>
                        {bulkNamePrefix.trim() && bulkCount >= 1 && bulkCount <= UNIT_BATCH_MAX ? (
                            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono break-words">
                                {t("form.batchPreview", {
                                    list:
                                        bulkCount <= 3
                                            ? buildUnitNumbersFromPrefix(bulkNamePrefix, bulkCount).join(", ")
                                            : `${buildUnitNumbersFromPrefix(bulkNamePrefix, 3).join(", ")}${t("form.batchAndMore", { n: bulkCount - 3 })}`,
                                })}
                            </p>
                        ) : null}
                        {listError && <p className="text-xs text-red-500">{listError}</p>}
                    </div>
                ) : (
                    <Input
                        label={t("form.unitNumber")}
                        placeholder={t("form.unitNumberPlaceholder")}
                        {...register("number")}
                        error={errors.number?.message as string}
                    />
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("form.type")}
                    </label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        {...register("type")}
                    >
                        {(() => {
                            const activeComplexId = complexId || watchedComplexId || (initialData as any)?.complexId;
                            const activeComplex = complexes?.find(c => c.id === activeComplexId);
                            const complexType = activeComplex?.type || "RESIDENTIAL";

                            /** Local comercial, oficina y clínica: edificio (uso mixto) o centro comercial. */
                            const commercialTypeOptions = (
                                <>
                                    <option value="Local comercial">{t("form.typeLocalCommercial")}</option>
                                    {initialData?.type === "Local" ? (
                                        <option value="Local">{t("form.typeLocalLegacy")}</option>
                                    ) : null}
                                    <option value="Oficina">{t("form.typeOffice")}</option>
                                    <option value="Clínica">{t("form.typeClinic")}</option>
                                </>
                            );

                            if (complexType === "SHOPPING_CENTER") {
                                return (
                                    <>
                                        {commercialTypeOptions}
                                        <option value="Otro">{t("form.typeOther")}</option>
                                    </>
                                );
                            }

                            if (complexType === "BUILDING") {
                                return (
                                    <>
                                        <option value="Apartamento">{t("form.typeApartment")}</option>
                                        <option value="Casa">{t("form.typeHouse")}</option>
                                        {commercialTypeOptions}
                                        <option value="Otro">{t("form.typeOther")}</option>
                                    </>
                                );
                            }

                            return (
                                <>
                                    <option value="Apartamento">{t("form.typeApartment")}</option>
                                    <option value="Casa">{t("form.typeHouse")}</option>
                                    <option value="Oficina">{t("form.typeOffice")}</option>
                                    <option value="Otro">{t("form.typeOther")}</option>
                                </>
                            );
                        })()}
                    </select>
                    {errors.type?.message && (
                        <p className="text-xs text-red-500 mt-1">{errors.type?.message as string}</p>
                    )}
                </div>

                <Input
                    label={t("form.bedrooms")}
                    type="number"
                    {...register("bedrooms", { valueAsNumber: true })}
                    error={errors.bedrooms?.message as string}
                />

                <Input
                    label={t("form.bathrooms")}
                    type="number"
                    step="0.5"
                    {...register("bathrooms", { valueAsNumber: true })}
                    error={errors.bathrooms?.message as string}
                />

                <Input
                    label={t("form.parkingSpots")}
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register("parkingSpots", { valueAsNumber: true })}
                    error={errors.parkingSpots?.message as string}
                />

                <Input
                    label={t("form.area")}
                    type="number"
                    {...register("area", { valueAsNumber: true })}
                    error={errors.area?.message as string}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("form.status")}
                    </label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        {...register("status")}
                    >
                        <option value="VACANT">{t("vacant")}</option>
                        <option value="OCCUPIED">{t("occupied")}</option>
                        <option value="MAINTENANCE">{t("maintenance")}</option>
                    </select>
                </div>
            </div>

            {/* Optional Services */}
            {availableServices.length > 0 && (
                <div className="space-y-3 pt-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t("form.optionalServices")}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {availableServices.map((service) => (
                            <label
                                key={service.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    value={service.id}
                                    {...register("serviceIds")}
                                    className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary/20"
                                />
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{service.name}</p>
                                    <p className="text-xs text-slate-500">${Number(service.basePrice).toFixed(2)} / {FREQ_KEYS[service.frequency] ? tf(FREQ_KEYS[service.frequency]) : service.frequency}</p>
                                </div>
                                {service.hasQuantity && (
                                    <input
                                        type="number"
                                        min={1}
                                        placeholder={t("form.quantityShort")}
                                        className="ml-2 w-16 px-2 py-1 border rounded"
                                        value={serviceQuantities[service.id] || 1}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => handleQuantityChange(service.id, e.target.value)}
                                    />
                                )}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {isLoadingServices && (
                <p className="text-xs text-slate-500 animate-pulse">{t("form.loadingServices")}</p>
            )}

            <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={isLoading} className="w-full md:w-auto">
                    {initialData
                        ? t("form.updateUnit")
                        : bulkMode
                            ? t("form.createManyUnits")
                            : t("form.createUnit")}
                </Button>
            </div>
        </form>
    );
}

export function UnitForm({
    initialData,
    onSubmit,
    onSubmitBatch,
    isLoading,
    complexes,
    showComplexSelector,
    complexId,
}: UnitFormProps) {
    const t = useTranslations("Units");
    const isEditing = Boolean(initialData);
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkCount, setBulkCount] = useState(1);
    const [bulkNamePrefix, setBulkNamePrefix] = useState("");
    const [listError, setListError] = useState("");

    const showBatchToggle = !isEditing && Boolean(onSubmitBatch);

    const body = (
        <UnitFormBody
            key={showBatchToggle ? (bulkMode ? "bulk" : "single") : "default"}
            initialData={initialData}
            onSubmit={onSubmit}
            onSubmitBatch={onSubmitBatch}
            isLoading={isLoading}
            complexes={complexes}
            showComplexSelector={showComplexSelector}
            complexId={complexId}
            bulkMode={showBatchToggle && bulkMode}
            bulkCount={bulkCount}
            onBulkCountChange={setBulkCount}
            bulkNamePrefix={bulkNamePrefix}
            onBulkNamePrefixChange={setBulkNamePrefix}
            listError={listError}
            setListError={setListError}
        />
    );

    if (!showBatchToggle) {
        return body;
    }

    return (
        <div className="space-y-4">
            <div className="inline-flex w-full max-w-md rounded-lg border border-slate-200 dark:border-slate-800 p-1">
                <button
                    type="button"
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        !bulkMode
                            ? "bg-primary text-white"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => {
                        setBulkMode(false);
                        setListError("");
                    }}
                >
                    {t("form.modeSingle")}
                </button>
                <button
                    type="button"
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        bulkMode
                            ? "bg-primary text-white"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => {
                        setBulkMode(true);
                        setListError("");
                    }}
                >
                    {t("form.modeBatch")}
                </button>
            </div>
            {body}
        </div>
    );
}

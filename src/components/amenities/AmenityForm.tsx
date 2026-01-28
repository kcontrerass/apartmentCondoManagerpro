"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAmenitySchema, CreateAmenityInput } from "@/lib/validations/amenity";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AmenityType } from "@prisma/client";

interface AmenityFormProps {
    onSubmit: (data: CreateAmenityInput) => void;
    initialData?: Partial<CreateAmenityInput>;
    isLoading?: boolean;
    complexes: { id: string; name: string }[];
}

export function AmenityForm({ onSubmit, initialData, isLoading, complexes }: AmenityFormProps) {
    const t = useTranslations('Amenities');
    const tCommon = useTranslations('Common');

    const { register, handleSubmit, formState: { errors } } = useForm<CreateAmenityInput>({
        resolver: zodResolver(createAmenitySchema),
        defaultValues: {
            ...initialData,
            capacity: initialData?.capacity ? Number(initialData.capacity) : undefined,
            costPerDay: initialData?.costPerDay ? Number(initialData.costPerDay) : 0,
            costPerHour: initialData?.costPerHour ? Number(initialData.costPerHour) : 0,
        }
    });

    const amenityTypes = Object.values(AmenityType).map(type => ({
        value: type,
        label: t(`types.${type}`)
    }));

    const complexOptions = [
        { value: "", label: t('form.selectComplex') },
        ...complexes.map(c => ({
            value: c.id,
            label: c.name
        }))
    ];

    return (
        <form onSubmit={handleSubmit((data) => onSubmit(data as unknown as CreateAmenityInput))} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label={t('form.name')}
                    {...register("name")}
                    error={errors.name?.message}
                />
                <Select
                    label={t('form.type')}
                    options={amenityTypes}
                    {...register("type")}
                    error={errors.type?.message}
                />
            </div>

            <Input
                label={t('form.description')}
                {...register("description")}
                error={errors.description?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 pt-8">
                    <input
                        type="checkbox"
                        id="requiresPayment"
                        {...register("requiresPayment")}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="requiresPayment" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {t('form.requiresPayment')}
                    </label>
                </div>

                <Input
                    label={t('form.capacity')}
                    type="number"
                    {...register("capacity", { valueAsNumber: true })}
                    error={errors.capacity?.message}
                />
            </div>

            {/* Conditionally render cost fields based on requiresPayment - React Hook Form's watch would be ideal here but for now just showing them all is safer or we can check form values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="col-span-2">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('form.costs')}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{t('form.costsHelp')}</p>
                </div>
                <Input
                    label={t('form.costPerDay')}
                    type="number"
                    step="0.01"
                    {...register("costPerDay", { valueAsNumber: true })}
                    error={errors.costPerDay?.message}
                />
                <Input
                    label={t('form.costPerHour')}
                    type="number"
                    step="0.01"
                    {...register("costPerHour", { valueAsNumber: true })}
                    error={errors.costPerHour?.message}
                />
            </div>


            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('form.operatingHours')}</h4>
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={t('form.openTime')}
                        type="time"
                        {...register("operatingHours.open")}
                        error={errors.operatingHours?.open?.message}
                    />
                    <Input
                        label={t('form.closeTime')}
                        type="time"
                        {...register("operatingHours.close")}
                        error={errors.operatingHours?.close?.message}
                    />
                </div>
            </div>

            {!initialData?.complexId && (
                <Select
                    label={t('form.selectComplex')}
                    options={complexOptions}
                    {...register("complexId")}
                    error={errors.complexId?.message}
                />
            )}

            <div className="flex justify-end gap-3 pt-4">
                <Button type="submit" variant="primary" isLoading={isLoading}>
                    {tCommon('save')}
                </Button>
            </div>
        </form>
    );
}

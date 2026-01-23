import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { unitSchema, UnitInput } from "@/lib/validations/unit";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Unit } from "@prisma/client";

interface UnitFormProps {
    initialData?: Partial<Unit>;
    onSubmit: (data: UnitInput) => Promise<void>;
    isLoading?: boolean;
    complexes?: { id: string, name: string }[];
    showComplexSelector?: boolean;
}

export function UnitForm({ initialData, onSubmit, isLoading, complexes, showComplexSelector }: UnitFormProps) {
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(unitSchema),
        defaultValues: {
            number: initialData?.number || "",
            type: initialData?.type || "Apartamento",
            bedrooms: initialData?.bedrooms || 1,
            bathrooms: initialData?.bathrooms || 1,
            area: initialData?.area || 0,
            parkingSpots: (initialData as any)?.parkingSpots ?? 0,
            status: initialData?.status || "VACANT",
            complexId: (initialData as any)?.complexId || "",
            serviceIds: [],
        },
    });

    const watchedComplexId = useWatch({
        control,
        name: "complexId",
    });

    useEffect(() => {
        const idToUse = watchedComplexId || (initialData as any)?.complexId;

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
        // Construct the expected 'services' array
        const selectedServiceIds = data.serviceIds || [];
        const services = selectedServiceIds.map((id: string) => ({
            id,
            quantity: serviceQuantities[id] || 1
        }));

        const finalData = {
            ...data,
            parkingSpots: isNaN(data.parkingSpots) ? 0 : Number(data.parkingSpots),
            services
        };

        // Remove serviceIds as we're utilizing services array now, 
        // though the backend might still accept serviceIds, better to send the structure we designed
        console.log("Submitting unit data:", finalData);
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
                        Complejo
                    </label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        {...register("complexId")}
                    >
                        <option value="">Seleccione un complejo</option>
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
                <Input
                    label="Número de Unidad"
                    placeholder="Ej: A-101"
                    {...register("number")}
                    error={errors.number?.message as string}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Tipo
                    </label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        {...register("type")}
                    >
                        <option value="Apartamento">Apartamento</option>
                        <option value="Casa">Casa</option>
                        <option value="Otro">Otro</option>
                    </select>
                    {errors.type?.message && (
                        <p className="text-xs text-red-500 mt-1">{errors.type?.message as string}</p>
                    )}
                </div>

                <Input
                    label="Habitaciones"
                    type="number"
                    {...register("bedrooms", { valueAsNumber: true })}
                    error={errors.bedrooms?.message as string}
                />

                <Input
                    label="Baños"
                    type="number"
                    step="0.5"
                    {...register("bathrooms", { valueAsNumber: true })}
                    error={errors.bathrooms?.message as string}
                />

                <Input
                    label="Parqueos Propios"
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register("parkingSpots", { valueAsNumber: true })}
                    error={errors.parkingSpots?.message as string}
                />

                <Input
                    label="Área (m²)"
                    type="number"
                    {...register("area", { valueAsNumber: true })}
                    error={errors.area?.message as string}
                />

                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Estado
                    </label>
                    <select
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        {...register("status")}
                    >
                        <option value="VACANT">Vacante</option>
                        <option value="OCCUPIED">Ocupada</option>
                        <option value="MAINTENANCE">Mantenimiento</option>
                    </select>
                </div>
            </div>

            {/* Optional Services */}
            {availableServices.length > 0 && (
                <div className="space-y-3 pt-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Servicios Opcionales
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
                                    <p className="text-xs text-slate-500">${Number(service.basePrice).toFixed(2)} / {service.frequency}</p>
                                </div>
                                {service.hasQuantity && (
                                    <input
                                        type="number"
                                        min={1}
                                        placeholder="Cantidad"
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
                <p className="text-xs text-slate-500 animate-pulse">Cargando servicios disponibles...</p>
            )}

            <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={isLoading} className="w-full md:w-auto">
                    {initialData ? "Actualizar Unidad" : "Crear Unidad"}
                </Button>
            </div>
        </form>
    );
}

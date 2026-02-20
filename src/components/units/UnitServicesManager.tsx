"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useTranslations } from "next-intl";
import { formatPrice } from "@/lib/utils";
import { Role } from "@/types/roles";

interface UnitServicesManagerProps {
    unitId: string;
    complexId: string;
    userRole: Role;
}

export function UnitServicesManager({ unitId, complexId, userRole }: UnitServicesManagerProps) {
    const t = useTranslations("Services");
    const [unitServices, setUnitServices] = useState<any[]>([]);
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const fetchUnitServices = async () => {
        try {
            const response = await fetch(`/api/units/${unitId}/services`);
            const data = await response.json();
            if (response.ok) setUnitServices(data);
        } catch (error) {
            console.error("Error fetching unit services:", error);
        }
    };

    const fetchAvailableServices = async () => {
        try {
            const response = await fetch(`/api/services?complexId=${complexId}`);
            const data = await response.json();
            if (response.ok) setAvailableServices(data);
        } catch (error) {
            console.error("Error fetching available services:", error);
        }
    };

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            await Promise.all([fetchUnitServices(), fetchAvailableServices()]);
            setIsLoading(false);
        };
        load();
    }, [unitId, complexId]);

    const handleAssign = async (serviceId: string) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/units/${unitId}/services`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ serviceId }),
            });

            if (response.ok) {
                await fetchUnitServices();
                setIsModalOpen(false);
            } else {
                const errorData = await response.json();
                alert(errorData.error || t("errorSaving"));
            }
        } catch (error) {
            console.error("Error assigning service:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemove = async (assignmentId: string) => {
        try {
            const response = await fetch(`/api/unit-services/${assignmentId}`, {
                method: "DELETE",
            });
            if (response.ok) {
                await fetchUnitServices();
            }
        } catch (error) {
            console.error("Error removing service:", error);
        } finally {
            setConfirmDeleteId(null);
        }
    };

    if (isLoading) return <Spinner />;

    const assignedServiceIds = new Set(unitServices.map((us) => us.serviceId));
    const unassignedServices = availableServices.filter((s) => !assignedServiceIds.has(s.id));

    return (
        <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">{t("unitServices")}</h3>
                {userRole !== Role.GUARD && userRole !== Role.BOARD_OF_DIRECTORS && (
                    <Button variant="secondary" size="sm" icon="add" onClick={() => setIsModalOpen(true)}>
                        {t("assignService")}
                    </Button>
                )}
            </div>

            {unitServices.length > 0 ? (
                <div className="space-y-4">
                    {unitServices.map((us) => (
                        <div key={us.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium">{us.service.name}</p>
                                    <Badge variant={us.service.isRequired ? "info" : "neutral"} className="text-[10px] px-1.5 py-0">
                                        {us.service.isRequired ? "Obligatorio" : "Opcional"}
                                    </Badge>
                                </div>
                                <p className="text-xs text-slate-500">
                                    {formatPrice(us.customPrice || us.service.basePrice)} • {us.service.frequency}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge variant={us.status === "ACTIVE" ? "success" : "neutral"}>
                                    {us.status}
                                </Badge>
                                {userRole !== Role.GUARD && userRole !== Role.BOARD_OF_DIRECTORS && (
                                    <button
                                        onClick={() => setConfirmDeleteId(us.id)}
                                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-500">No hay servicios asignados.</p>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t("assignService")}>
                <div className="space-y-4">
                    {unassignedServices.length > 0 ? (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {unassignedServices.map((service) => (
                                <div key={service.id} className="py-3 flex justify-between items-center">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{service.name}</p>
                                            <Badge variant={service.isRequired ? "info" : "neutral"} className="text-[10px] px-1.5 py-0">
                                                {service.isRequired ? "Obligatorio" : "Opcional"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-slate-500">{formatPrice(service.basePrice)}</p>
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => handleAssign(service.id)}
                                        isLoading={isSubmitting}
                                    >
                                        Asignar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center py-4 text-slate-500">No hay más servicios disponibles para este complejo.</p>
                    )}
                </div>
            </Modal>
            <ConfirmModal
                isOpen={!!confirmDeleteId}
                onClose={() => setConfirmDeleteId(null)}
                onConfirm={() => confirmDeleteId && handleRemove(confirmDeleteId)}
                title="Eliminar Servicio"
                message={t("deleteConfirm")}
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </Card>
    );
}

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { ServiceTable } from "@/components/services/ServiceTable";
import { ServiceForm } from "@/components/services/ServiceForm";
import { ServiceSchema } from "@/lib/validations/service";
import { useTranslations } from 'next-intl';
import { Role } from "@/types/roles";
import { toast } from "sonner";

export function ServicesClient({ userRole, userId }: { userRole: Role, userId: string }) {
    const t = useTranslations('Services');
    const searchParams = useSearchParams();
    const complexIdFromQuery = searchParams.get("complexId");

    const [services, setServices] = useState<any[]>([]);
    const [complexes, setComplexes] = useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [subscribingId, setSubscribingId] = useState<string | null>(null);
    const [residentUnitId, setResidentUnitId] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'DELETE' | 'SUBSCRIBE' | 'UNSUBSCRIBE';
        isLoading?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'DELETE'
    });

    useEffect(() => {
        const fetchComplexes = async () => {
            try {
                const response = await fetch("/api/complexes");
                const data = await response.json();
                if (response.ok) setComplexes(data);
            } catch (error) {
                console.error("Error fetching complexes:", error);
            }
        };
        fetchComplexes();

        if (userRole === Role.RESIDENT) {
            const fetchResidentData = async () => {
                try {
                    const response = await fetch(`/api/residents?userId=${userId}`);
                    const data = await response.json();
                    if (response.ok && data.length > 0) {
                        setResidentUnitId(data[0].unitId);
                    }
                } catch (error) {
                    console.error("Error fetching resident data:", error);
                }
            };
            fetchResidentData();
        }
    }, [userRole, userId]);

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const url = complexIdFromQuery
                ? `/api/services?complexId=${complexIdFromQuery}`
                : `/api/services`;

            const response = await fetch(url);
            const data = await response.json();
            if (response.ok) {
                setServices(data);
            }
        } catch (error) {
            console.error("Error fetching services:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [complexIdFromQuery]);

    const handleSubmit = async (data: ServiceSchema) => {
        setIsSubmitting(true);
        try {
            const url = editingService
                ? `/api/services/${editingService.id}`
                : "/api/services";

            const payload = { ...data };
            if (complexIdFromQuery && !editingService) {
                payload.complexId = complexIdFromQuery;
            }

            const response = await fetch(url, {
                method: editingService ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setIsModalOpen(false);
                setEditingService(null);
                fetchServices();
                toast.success(t('successSave'));
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || t('errorSaving'));
            }
        } catch (error) {
            console.error("Error saving service:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubscribe = async (service: any, quantity: number = 1) => {
        if (!residentUnitId) {
            toast.error(t('errorNoUnit'));
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Confirmar Contratación',
            message: `¿Desea contratar el servicio ${service.name}${service.hasQuantity ? ` (Cantidad: ${quantity})` : ''}?`,
            type: 'SUBSCRIBE',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true }));
                try {
                    const response = await fetch(`/api/units/${residentUnitId}/services`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            serviceId: service.id,
                            quantity: quantity,
                            status: "ACTIVE",
                        }),
                    });

                    if (response.ok) {
                        toast.success("Servicio contratado exitosamente");
                        fetchServices();
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    } else {
                        const errorData = await response.json();
                        toast.error(errorData.error || t('errorSaving'));
                    }
                } catch (error) {
                    console.error("Error subscribing to service:", error);
                    toast.error("Error al procesar la solicitud");
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    const handleUnsubscribe = async (unitServiceId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Cancelar Servicio',
            message: '¿Seguro que desea dar de baja este servicio? Ya no se incluirá en las próximas facturas.',
            type: 'UNSUBSCRIBE',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true }));
                try {
                    const response = await fetch(`/api/unit-services/${unitServiceId}`, {
                        method: "DELETE",
                    });

                    if (response.ok) {
                        toast.success("Servicio cancelado exitosamente");
                        fetchServices();
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    } else {
                        const errorData = await response.json();
                        toast.error(errorData.error || t('errorSaving'));
                    }
                } catch (error) {
                    console.error("Error unsubscribing from service:", error);
                    toast.error("Error al procesar la solicitud");
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    const handleUpdateQuantity = async (unitServiceId: string, quantity: number) => {
        setSubscribingId(unitServiceId);
        try {
            const response = await fetch(`/api/unit-services/${unitServiceId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantity }),
            });

            if (response.ok) {
                toast.success("Cantidad actualizada");
                fetchServices();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || t('errorSaving'));
            }
        } catch (error) {
            console.error("Error updating service quantity:", error);
        } finally {
            setSubscribingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Eliminar Servicio',
            message: t('deleteConfirm'),
            type: 'DELETE',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isLoading: true }));
                try {
                    const response = await fetch(`/api/services/${id}`, { method: "DELETE" });
                    if (response.ok) {
                        toast.success("Servicio eliminado permanentemente");
                        fetchServices();
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    } else {
                        const errorData = await response.json();
                        toast.error(errorData.error || "Error al eliminar");
                    }
                } catch (error) {
                    console.error("Error deleting service:", error);
                    toast.error("Error al procesar la eliminación");
                } finally {
                    setConfirmModal(prev => ({ ...prev, isLoading: false }));
                }
            }
        });
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('title')}
                subtitle={complexIdFromQuery ? t('subtitle') : t('allServices')}
                actions={
                    userRole !== Role.GUARD && userRole !== Role.BOARD_OF_DIRECTORS && userRole !== Role.RESIDENT && (
                        <Button
                            variant="primary"
                            icon="add"
                            onClick={() => {
                                setEditingService(null);
                                setIsModalOpen(true);
                            }}
                        >
                            {t('newService')}
                        </Button>
                    )
                }
            />

            <Card>
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Spinner />
                    </div>
                ) : (
                    <ServiceTable
                        services={services}
                        userRole={userRole}
                        onEdit={(service) => {
                            setEditingService(service);
                            setIsModalOpen(true);
                        }}
                        onDelete={handleDelete}
                        onSubscribe={handleSubscribe}
                        onUpdateQuantity={handleUpdateQuantity}
                        onUnsubscribe={handleUnsubscribe}
                        isSubmitting={subscribingId}
                    />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingService(null);
                }}
                title={editingService ? t('editService') : t('newService')}
            >
                <ServiceForm
                    initialData={editingService}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    complexes={complexes}
                    showComplexSelector={!complexIdFromQuery && !editingService}
                    defaultComplexId={complexIdFromQuery || undefined}
                />
            </Modal>

            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => !confirmModal.isLoading && setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                title={confirmModal.title}
                footer={
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                            disabled={confirmModal.isLoading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant={confirmModal.type === 'DELETE' ? 'danger' : 'primary'}
                            onClick={confirmModal.onConfirm}
                            isLoading={confirmModal.isLoading}
                        >
                            {confirmModal.type === 'DELETE' ? 'Eliminar' :
                                confirmModal.type === 'SUBSCRIBE' ? 'Contratar' : 'Confirmar Baja'}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        {confirmModal.message}
                    </p>
                </div>
            </Modal>
        </div>
    );
}

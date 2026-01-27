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
import { Role } from "@prisma/client";

export function ServicesClient({ userRole }: { userRole: Role }) {
    const t = useTranslations('Services');
    const searchParams = useSearchParams();
    const complexIdFromQuery = searchParams.get("complexId");

    const [services, setServices] = useState<any[]>([]);
    const [complexes, setComplexes] = useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
    }, []);

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
            } else {
                const errorData = await response.json();
                alert(errorData.error || t('errorSaving'));
            }
        } catch (error) {
            console.error("Error saving service:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return;

        try {
            const response = await fetch(`/api/services/${id}`, { method: "DELETE" });
            if (response.ok) {
                fetchServices();
            }
        } catch (error) {
            console.error("Error deleting service:", error);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('title')}
                subtitle={complexIdFromQuery ? t('subtitle') : t('allServices')}
                actions={
                    userRole !== Role.GUARD && userRole !== Role.OPERATOR && (
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
        </div>
    );
}

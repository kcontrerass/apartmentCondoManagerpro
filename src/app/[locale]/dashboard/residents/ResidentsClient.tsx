"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { ResidentTable } from "@/components/residents/ResidentTable";
import { ResidentForm } from "@/components/residents/ResidentForm";
import { ResidentInput } from "@/lib/validations/resident";
import { Resident, Unit, User, Role } from "@prisma/client";
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';

interface ResidentWithExtras extends Resident {
    user: {
        name: string;
        email: string;
        phone: string | null;
    };
    unit: Unit & {
        complex: {
            name: string;
        };
    };
}

export function ResidentsClient({ userRole }: { userRole?: Role }) {
    const t = useTranslations('Residents');
    const router = useRouter();
    const searchParams = useSearchParams();
    const unitIdFromQuery = searchParams.get("unitId");
    const complexIdFromQuery = searchParams.get("complexId");

    const [residents, setResidents] = useState<ResidentWithExtras[]>([]);
    const [users, setUsers] = useState<{ id: string, name: string, email: string }[]>([]);
    const [units, setUnits] = useState<{ id: string, number: string, complex: { name: string } }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResident, setEditingResident] = useState<ResidentWithExtras | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch residents
            let residentsUrl = "/api/residents";
            const params = new URLSearchParams();
            if (unitIdFromQuery) params.append("unitId", unitIdFromQuery);
            if (complexIdFromQuery) params.append("complexId", complexIdFromQuery);
            if (params.toString()) residentsUrl += `?${params.toString()}`;

            const [resResponse, usersResponse, unitsResponse] = await Promise.all([
                fetch(residentsUrl),
                fetch("/api/users"),
                fetch("/api/units")
            ]);

            const [resData, usersData, unitsData] = await Promise.all([
                resResponse.json(),
                usersResponse.json(),
                unitsResponse.json()
            ]);

            if (resResponse.ok) setResidents(resData);
            if (usersResponse.ok) setUsers(usersData);
            if (unitsResponse.ok) setUnits(unitsData);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [unitIdFromQuery, complexIdFromQuery]);

    const handleSubmit = async (data: ResidentInput) => {
        setIsSubmitting(true);
        try {
            const url = editingResident
                ? `/api/residents/${editingResident.id}`
                : `/api/residents`;

            const response = await fetch(url, {
                method: editingResident ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                setIsModalOpen(false);
                setEditingResident(null);
                fetchData();
            } else {
                const errorData = await response.json();
                alert(errorData.error || "Ocurrió un error al guardar al residente");
            }
        } catch (error) {
            console.error("Error saving resident:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar esta asignación de residente?")) return;

        try {
            const response = await fetch(`/api/residents/${id}`, { method: "DELETE" });
            if (response.ok) {
                fetchData();
            }
        } catch (error) {
            console.error("Error deleting resident:", error);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={
                    userRole !== Role.GUARD && userRole !== Role.OPERATOR && (
                        <Button
                            variant="primary"
                            icon="add"
                            onClick={() => {
                                setEditingResident(null);
                                setIsModalOpen(true);
                            }}
                        >
                            {t('newResident')}
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
                    <ResidentTable
                        residents={residents}
                        userRole={userRole}
                        onEdit={(resident) => {
                            setEditingResident(resident);
                            setIsModalOpen(true);
                        }}
                        onDelete={handleDelete}
                        onView={(id) => router.push(`/dashboard/residents/${id}`)}
                    />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingResident(null);
                }}
                title={editingResident ? "Editar Asignación" : "Asignar Nuevo Residente"}
                size="lg"
            >
                <ResidentForm
                    initialData={editingResident || { unitId: unitIdFromQuery || undefined } as any}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    users={users}
                    units={units}
                />
            </Modal>
        </div>
    );
}

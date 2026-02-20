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
import { Resident, Unit, User } from "@prisma/client";
import { Role } from "@/types/roles";
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { toast } from "sonner";

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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [residentToDelete, setResidentToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
                toast.success("Residente guardado exitosamente");
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Ocurrió un error al guardar al residente");
            }
        } catch (error) {
            console.error("Error saving resident:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!residentToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/residents/${residentToDelete}`, { method: "DELETE" });
            if (response.ok) {
                toast.success("Asignación de residente eliminada");
                setIsDeleteModalOpen(false);
                setResidentToDelete(null);
                fetchData();
            } else {
                const data = await response.json();
                toast.error(data.error || "Error al eliminar la asignación");
            }
        } catch (error) {
            console.error("Error deleting resident:", error);
            toast.error("Error al procesar la eliminación");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('title')}
                subtitle={t('subtitle')}
                actions={
                    userRole !== Role.GUARD && userRole !== Role.BOARD_OF_DIRECTORS && (
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
                        onDelete={(id) => {
                            setResidentToDelete(id);
                            setIsDeleteModalOpen(true);
                        }}
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

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                title="Confirmar Eliminación"
                footer={
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar Asignación"}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        ¿Está seguro de eliminar esta asignación de residente?
                    </p>
                    <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                        <strong>Atención:</strong> Esta acción desvinculará al residente de la unidad. Si es el único residente, la unidad pasará a estar vacante.
                    </p>
                </div>
            </Modal>
        </div>
    );
}

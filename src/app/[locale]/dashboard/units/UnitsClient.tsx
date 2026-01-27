"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { UnitTable } from "@/components/units/UnitTable";
import { UnitForm } from "@/components/units/UnitForm";
import { UnitInput } from "@/lib/validations/unit";
import { Unit, Resident, Role } from "@prisma/client";
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';

interface UnitWithResidents extends Unit {
    residents: (Resident & { user: { name: string; email: string } })[];
    complex?: { name: string };
}

export function UnitsClient({ userRole }: { userRole?: Role }) {
    const t = useTranslations('Units');
    const router = useRouter();
    const searchParams = useSearchParams();
    const complexIdFromQuery = searchParams.get("complexId");

    const [units, setUnits] = useState<UnitWithResidents[]>([]);
    const [complexes, setComplexes] = useState<{ id: string, name: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<UnitWithResidents | null>(null);
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

    const fetchUnits = async () => {
        setIsLoading(true);
        try {
            const url = complexIdFromQuery
                ? `/api/complexes/${complexIdFromQuery}/units`
                : `/api/units`;

            const response = await fetch(url);
            const data = await response.json();
            if (response.ok) {
                setUnits(data);
            }
        } catch (error) {
            console.error("Error fetching units:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUnits();
    }, [complexIdFromQuery]);

    const handleSubmit = async (data: UnitInput) => {
        setIsSubmitting(true);
        try {
            const url = editingUnit
                ? `/api/units/${editingUnit.id}`
                : complexIdFromQuery
                    ? `/api/complexes/${complexIdFromQuery}/units`
                    : `/api/units`;

            const payload = { ...data };
            if (complexIdFromQuery && !editingUnit) {
                (payload as any).complexId = complexIdFromQuery;
            }

            const response = await fetch(url, {
                method: editingUnit ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                setIsModalOpen(false);
                setEditingUnit(null);
                fetchUnits();
            } else {
                const errorData = await response.json();
                alert(errorData.error || t('errorSaving'));
            }
        } catch (error) {
            console.error("Error saving unit:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('deleteConfirm'))) return;

        try {
            const response = await fetch(`/api/units/${id}`, { method: "DELETE" });
            if (response.ok) {
                fetchUnits();
            }
        } catch (error) {
            console.error("Error deleting unit:", error);
        }
    };

    return (
        <div className="space-y-8">
            <PageHeader
                title={t('title')}
                subtitle={complexIdFromQuery ? t('managingUnits') : t('allRegistered')}
                actions={
                    userRole !== Role.GUARD && userRole !== Role.OPERATOR && (
                        <Button
                            variant="primary"
                            icon="add"
                            onClick={() => {
                                setEditingUnit(null);
                                setIsModalOpen(true);
                            }}
                        >
                            {t('newUnit')}
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
                    <UnitTable
                        units={units}
                        userRole={userRole}
                        onEdit={(unit) => {
                            setEditingUnit(unit);
                            setIsModalOpen(true);
                        }}
                        onDelete={handleDelete}
                        onView={(id) => router.push(`/dashboard/units/${id}`)}
                    />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingUnit(null);
                }}
                title={editingUnit ? t('editUnit') : t('newUnit')}
            >
                <UnitForm
                    initialData={editingUnit || undefined}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    complexes={complexes}
                    showComplexSelector={!complexIdFromQuery && !editingUnit}
                />
            </Modal>
        </div>
    );
}

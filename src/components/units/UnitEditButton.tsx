"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { UnitForm } from "@/components/units/UnitForm";
import { UnitInput } from "@/lib/validations/unit";
import { toast } from "sonner";
import { Unit } from "@prisma/client";

export function UnitEditButton({ unit }: { unit: Unit }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (data: UnitInput) => {
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/units/${unit.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                toast.success("Unidad actualizada exitosamente");
                setIsModalOpen(false);
                router.refresh();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Error al actualizar la unidad");
            }
        } catch (error) {
            console.error("Error saving unit:", error);
            toast.error("Error al guardar la unidad");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Button variant="primary" icon="edit" onClick={() => setIsModalOpen(true)}>
                Editar Unidad
            </Button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    if (!isSubmitting) setIsModalOpen(false);
                }}
                title="Editar Unidad"
            >
                <UnitForm
                    initialData={unit}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    showComplexSelector={false}
                    complexId={unit.complexId}
                />
            </Modal>
        </>
    );
}

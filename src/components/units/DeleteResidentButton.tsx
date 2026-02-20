"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";

interface DeleteResidentButtonProps {
    residentId: string;
    residentName: string;
}

export function DeleteResidentButton({ residentId, residentName }: DeleteResidentButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const response = await fetch(`/api/residents/${residentId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al eliminar el residente");
            }

            toast.success("Residente eliminado exitosamente");
            setIsModalOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsModalOpen(true)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Eliminar Residente"
            >
                <span className="material-symbols-outlined text-[20px]">
                    delete
                </span>
            </Button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => !isDeleting && setIsModalOpen(false)}
                title="Confirmar Eliminación"
                footer={
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsModalOpen(false)}
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
                            {isDeleting ? "Eliminando..." : "Confirmar Eliminación"}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        ¿Estás seguro de que deseas eliminar a <span className="font-bold text-slate-900 dark:text-white">{residentName}</span> de esta unidad?
                    </p>
                    <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                        <strong>Nota:</strong> Si este es el último residente, la unidad pasará automáticamente a estado <strong>Vacante</strong>.
                    </p>
                </div>
            </Modal>
        </>
    );
}

"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ComplexTable } from "@/components/complexes/ComplexTable";
import { useComplexes } from "@/hooks/useComplexes";
import { useState } from "react";
import { ComplexType } from "@prisma/client";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { useTranslations } from "next-intl";
import { Role } from "@/types/roles";
import type { ComplexWithCount } from "@/hooks/useComplexes";

interface ComplexesClientProps {
    userRole?: string;
}

export function ComplexesClient({ userRole }: ComplexesClientProps) {
    const t = useTranslations("Complexes");
    const { complexes, loading, deleteComplex, fetchComplexes } = useComplexes();
    const [search, setSearch] = useState("");
    const [type, setType] = useState("");
    const [extendingSubscriptionId, setExtendingSubscriptionId] = useState<string | null>(null);

    const [complexToDelete, setComplexToDelete] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleReactivateSubscription = async (complex: ComplexWithCount) => {
        if (userRole !== Role.SUPER_ADMIN) return;
        if (
            !window.confirm(
                t("reactivateSubscriptionConfirm", { name: complex.name })
            )
        ) {
            return;
        }
        setExtendingSubscriptionId(complex.id);
        try {
            const res = await fetch("/api/platform-fee/admin/manual-extend-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ complexId: complex.id }),
            });
            const json = await res.json();
            if (!res.ok) {
                const errMsg =
                    json?.error &&
                    typeof json.error === "object" &&
                    "message" in json.error &&
                    typeof (json.error as { message: unknown }).message === "string"
                        ? (json.error as { message: string }).message
                        : t("reactivateSubscriptionError");
                toast.error(errMsg);
                return;
            }
            toast.success(t("reactivateSubscriptionSuccess"));
            await fetchComplexes(search, type);
        } catch {
            toast.error(t("reactivateSubscriptionError"));
        } finally {
            setExtendingSubscriptionId(null);
        }
    };

    const handleDelete = async () => {
        if (!complexToDelete) return;
        setIsDeleting(true);
        try {
            await deleteComplex(complexToDelete);
            toast.success("Complejo eliminado exitosamente");
            setIsDeleteModalOpen(false);
            setComplexToDelete(null);
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar el complejo");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-4 items-end bg-white dark:bg-background-dark p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Buscar
                    </label>
                    <Input
                        placeholder="Nombre o dirección..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && fetchComplexes(search, type)}
                    />
                </div>
                <div className="w-full md:w-64">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Tipo
                    </label>
                    <Select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        options={[
                            { label: "Todos los tipos", value: "" },
                            { label: "Edificio", value: ComplexType.BUILDING },
                            { label: "Condominio", value: ComplexType.CONDO },
                            { label: "Centro Comercial", value: ComplexType.SHOPPING_CENTER },
                        ]}
                    />
                </div>
                <Button variant="secondary" onClick={() => fetchComplexes(search, type)}>
                    Filtrar
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <ComplexTable
                    complexes={complexes}
                    onDelete={(id) => {
                        setComplexToDelete(id);
                        setIsDeleteModalOpen(true);
                    }}
                    userRole={userRole}
                    extendingSubscriptionId={extendingSubscriptionId}
                    onReactivateSubscription={
                        userRole === Role.SUPER_ADMIN ? handleReactivateSubscription : undefined
                    }
                />
            )}

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                title="Confirmar Eliminación"
                footer={
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            isLoading={isDeleting}
                        >
                            {isDeleting ? "Eliminando..." : "Eliminar Complejo"}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        ¿Estás seguro de que deseas eliminar este complejo? Esta acción eliminará todas las unidades, residentes e información relacionada.
                    </p>
                </div>
            </Modal>
        </div>
    );
}

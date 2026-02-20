"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { StaffTable } from "@/components/staff/StaffTable";
import { StaffForm } from "@/components/staff/StaffForm";
import { Spinner } from "@/components/ui/Spinner"; // Check correct UI component paths
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Role } from "@/types/roles";

interface StaffClientProps {
    initialComplexes: { id: string; name: string }[];
    currentUserRole: Role;
}

export const StaffClient = ({ initialComplexes, currentUserRole }: StaffClientProps) => {
    const t = useTranslations("common");
    const [staff, setStaff] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchStaff = async () => {
        try {
            const res = await fetch("/api/staff");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setStaff(data);
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar el equipo");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const url = editingUser ? `/api/staff/${editingUser.id}` : "/api/staff";
            const method = editingUser ? "PUT" : "POST"; // Route uses PUT for update? Yes.

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) {
                toast.error(result.error || "Error al guardar");
                return;
            }

            toast.success("Usuario guardado exitosamente");
            setIsModalOpen(false);
            fetchStaff();
            setEditingUser(null);
        } catch (error) {
            console.error(error);
            toast.error("Error de conexión");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            const res = await fetch(`/api/staff/${userToDelete.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error || "Error al eliminar");
                return;
            }

            toast.success("Usuario eliminado");
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            fetchStaff();
        } catch (error) {
            console.error(error);
            toast.error("Error al eliminar");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const filteredStaff = staff.filter((user: any) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title="Equipo y Personal"
                subtitle="Gestiona los usuarios del staff (Guardias, Operadores, Administradores)."
                actions={
                    <Button
                        variant="primary"
                        icon="person_add"
                        onClick={() => {
                            setEditingUser(null);
                            setIsModalOpen(true);
                        }}
                    >
                        Nuevo Usuario
                    </Button>
                }
            />

            <Card>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o rol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Spinner />
                    </div>
                ) : (
                    <StaffTable
                        staff={filteredStaff}
                        onEdit={handleEdit}
                        onDelete={(user) => {
                            setUserToDelete(user);
                            setIsDeleteModalOpen(true);
                        }}
                        currentUserRole={currentUserRole}
                    />
                )}
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            >
                <StaffForm
                    initialData={editingUser}
                    onSubmit={handleSubmit}
                    isLoading={isSubmitting}
                    isEditing={!!editingUser}
                    complexes={initialComplexes}
                    currentUserRole={currentUserRole}
                />
            </Modal>

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
                            {isDeleting ? "Eliminando..." : "Eliminar Usuario"}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        ¿Estás seguro de eliminar a <span className="font-bold text-slate-900 dark:text-white">{userToDelete?.name}</span>? Esta acción es irreversible.
                    </p>
                </div>
            </Modal>
        </div>
    );
};

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

import { Role } from "@prisma/client";

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

    const fetchStaff = async () => {
        try {
            const res = await fetch("/api/staff");
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setStaff(data);
        } catch (error) {
            console.error(error);
            // toast error
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
                alert(result.error || "Error al guardar");
                return;
            }

            setIsModalOpen(false);
            fetchStaff();
            setEditingUser(null);
        } catch (error) {
            console.error(error);
            alert("Error de conexión");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (user: any) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleDelete = async (user: any) => {
        if (!confirm(`¿Estás seguro de eliminar a ${user.name}?`)) return;

        try {
            const res = await fetch(`/api/staff/${user.id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Error al eliminar");
                return;
            }

            fetchStaff();
        } catch (error) {
            console.error(error);
            alert("Error al eliminar");
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
                        onDelete={handleDelete}
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
        </div>
    );
};

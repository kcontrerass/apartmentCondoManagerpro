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
    const t = useTranslations("Staff");
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
            toast.error(t("errorLoadingTeam"));
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
                toast.error(result.error || t("errorSaving"));
                return;
            }

            toast.success(t("userSaved"));
            setIsModalOpen(false);
            fetchStaff();
            setEditingUser(null);
        } catch (error) {
            console.error(error);
            toast.error(t("connectionError"));
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
                toast.error(data.error || t("errorDeleting"));
                return;
            }

            toast.success(t("userDeleted"));
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            fetchStaff();
        } catch (error) {
            console.error(error);
            toast.error(t("errorDeleting"));
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
                title={t("title")}
                subtitle={t("subtitle")}
                actions={
                    <Button
                        variant="primary"
                        icon="person_add"
                        onClick={() => {
                            setEditingUser(null);
                            setIsModalOpen(true);
                        }}
                    >
                        {t("newUser")}
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
                            placeholder={t("searchPlaceholder")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
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
                title={editingUser ? t("editUser") : t("newUser")}
            >
                <StaffForm
                    initialData={editingUser}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseModal}
                    isLoading={isSubmitting}
                    isEditing={!!editingUser}
                    complexes={initialComplexes}
                    currentUserRole={currentUserRole}
                />
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
                title={t("confirmDeleteTitle")}
                footer={
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            isLoading={isDeleting}
                        >
                            {isDeleting ? t("deleting") : t("deleteUser")}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-slate-600 dark:text-slate-400">
                        {t("confirmDeleteMessageStart")} <span className="font-bold text-slate-900 dark:text-white">{userToDelete?.name}</span>? {t("confirmDeleteMessageEnd")}
                    </p>
                </div>
            </Modal>
        </div>
    );
};

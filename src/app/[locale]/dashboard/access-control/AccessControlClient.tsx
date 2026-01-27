"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { VisitorForm } from "@/components/access/VisitorForm";
import { useTranslations } from "next-intl";
import { Role } from "@prisma/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface AccessControlClientProps {
    userRole: Role;
    initialComplexes: any[];
    residentUnit?: any;
}

export function AccessControlClient({ userRole, initialComplexes, residentUnit }: AccessControlClientProps) {
    const t = useTranslations("AccessControl");
    const [visitors, setVisitors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const isGuard = userRole === Role.GUARD || userRole === Role.OPERATOR || userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    const isResident = userRole === Role.RESIDENT;

    useEffect(() => {
        fetchVisitors();
    }, []);

    const fetchVisitors = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/visitors");
            const data = await response.ok ? await response.json() : [];
            setVisitors(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/visitors/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (response.ok) {
                toast.success("Estado actualizado");
                fetchVisitors();
            }
        } catch (error) {
            toast.error("Error al actualizar");
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SCHEDULED": return <Badge variant="info">Programada</Badge>;
            case "ARRIVED": return <Badge variant="success">En Complejo</Badge>;
            case "DEPARTED": return <Badge variant="neutral">Salida</Badge>;
            case "CANCELLED": return <Badge variant="error">Cancelada</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title={t("title")}
                subtitle={t("subtitle")}
                actions={
                    isResident && (
                        <Button onClick={() => setIsModalOpen(true)} icon="add_card">
                            {t("newVisitor")}
                        </Button>
                    )
                }
            />

            <div className="grid gap-4">
                {isLoading ? (
                    <Card className="p-8 text-center text-slate-500">Cargando...</Card>
                ) : visitors.length === 0 ? (
                    <Card className="p-8 text-center text-slate-500">{t("noVisitors")}</Card>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{t("visitorName")}</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{t("unit")}</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{t("scheduledDate")}</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{t("status")}</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">{t("actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {visitors.map((v: any) => (
                                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium">{v.visitorName}</div>
                                            <div className="text-xs text-slate-500">{v.visitorId}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">Unit {v.unit.number}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">{format(new Date(v.scheduledDate), "dd MMM, yyyy")}</div>
                                        </td>
                                        <td className="p-4">{getStatusBadge(v.status)}</td>
                                        <td className="p-4 text-right space-x-2">
                                            {isGuard && v.status === "SCHEDULED" && (
                                                <Button size="sm" onClick={() => handleStatusUpdate(v.id, "ARRIVED")} icon="login">
                                                    {t("checkIn")}
                                                </Button>
                                            )}
                                            {isGuard && v.status === "ARRIVED" && (
                                                <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(v.id, "DEPARTED")} icon="logout">
                                                    {t("checkOut")}
                                                </Button>
                                            )}
                                            {isResident && v.status === "SCHEDULED" && (
                                                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleStatusUpdate(v.id, "CANCELLED")} icon="cancel">
                                                    {t("cancel")}
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t("newVisitor")}
            >
                <VisitorForm
                    unitId={residentUnit?.id}
                    complexId={residentUnit?.complexId}
                    onSuccess={() => setIsModalOpen(false)}
                />
            </Modal>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { VisitorForm } from "@/components/access/VisitorForm";
import { useTranslations } from "next-intl";
import { Role } from "@/types/roles";
import { toast } from "sonner";
import { format } from "date-fns";

interface AccessControlClientProps {
    user: any;
    initialComplexes: any[];
    residentUnit?: any;
}

export function AccessControlClient({ user, initialComplexes, residentUnit }: AccessControlClientProps) {
    const t = useTranslations("AccessControl");
    const [visitors, setVisitors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const userRole = user?.role as Role;
    const userId = user?.id;

    // Safety check for complexId if not Super Admin
    const [complexId, setComplexId] = useState<string | null>(user?.complexId || null);

    const isGuard = userRole === Role.GUARD || userRole === Role.BOARD_OF_DIRECTORS || userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    const isResident = userRole === Role.RESIDENT;

    useEffect(() => {
        fetchVisitors();
    }, []);

    // Proactive complexId recovery for users with stale sessions
    useEffect(() => {
        const recoverComplexId = async () => {
            if (!complexId && userRole !== Role.SUPER_ADMIN && userId) {
                console.log(`[AccessControl] 🔍 Attempting complexId recovery...`);
                try {
                    const response = await fetch('/api/users/profile');
                    if (response.ok) {
                        const profileData = await response.json();
                        const recoveredId = profileData.complexId ||
                            (profileData.managedComplexes?.[0]?.id) ||
                            (profileData.residentProfile?.unit?.complexId);

                        if (recoveredId) {
                            console.log(`[AccessControl] ✅ Recovered complexId: ${recoveredId}`);
                            setComplexId(recoveredId);
                        }
                    }
                } catch (error) {
                    console.error('[AccessControl] ❌ Failed to recover complexId:', error);
                }
            }
        };

        recoverComplexId();
    }, [complexId, userRole, userId]);

    const fetchVisitors = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/visitors");
            const payload = await response.json();
            if (response.ok) {
                const data = payload?.data ?? payload;
                setVisitors(Array.isArray(data) ? data : []);
            } else {
                setVisitors([]);
                toast.error(payload?.error?.message || t("errorLoadingVisitors"));
            }
        } catch (error) {
            console.error(error);
            toast.error(t("errorLoadingVisitors"));
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
            const payload = await response.json().catch(() => null);
            if (response.ok) {
                toast.success(t("statusUpdated"));
                fetchVisitors();
            } else {
                toast.error(payload?.error?.message || t("errorUpdatingStatus"));
            }
        } catch (error) {
            toast.error(t("errorUpdatingStatus"));
        }
    };

    const handleDeleteVisitor = async (id: string) => {
        try {
            const response = await fetch(`/api/visitors/${id}`, {
                method: "DELETE",
            });
            const payload = await response.json().catch(() => null);
            if (response.ok) {
                toast.success(t("recordDeleted"));
                fetchVisitors();
            } else {
                toast.error(payload?.error?.message || t("errorDeleting"));
            }
        } catch {
            toast.error(t("errorDeleting"));
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "SCHEDULED": return <Badge variant="info">{t("scheduled")}</Badge>;
            case "ARRIVED": return <Badge variant="success">{t("arrived")}</Badge>;
            case "DEPARTED": return <Badge variant="neutral">{t("departed")}</Badge>;
            case "CANCELLED": return <Badge variant="error">{t("cancelled")}</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const filteredVisitors = visitors.filter((v: any) => {
        if (!searchTerm.trim()) return true;
        const query = searchTerm.toLowerCase();
        const haystack = [
            v.visitorName,
            v.visitorId,
            v.vehiclePlate,
            v.unit?.number,
            v.status,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return haystack.includes(query);
    });

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
                <Card className="p-4">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t("searchPlaceholder")}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-background-dark focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                        />
                    </div>
                </Card>

                {isLoading ? (
                    <Card className="p-8 text-center text-slate-500">{t("loading")}</Card>
                ) : filteredVisitors.length === 0 ? (
                    <Card className="p-8 text-center text-slate-500">{t("noVisitors")}</Card>
                ) : (
                    <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-background-dark/50">
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{t("visitorName")}</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{t("unit")}</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{t("scheduledDate")}</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{t("status")}</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">{t("actions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredVisitors.map((v: any) => (
                                    <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium">{v.visitorName}</div>
                                            <div className="text-xs text-slate-500">
                                                {v.visitorId || t("noDocument")}
                                                {v.vehiclePlate ? ` • ${t("plateLabel")}: ${v.vehiclePlate}` : ""}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-sm">{t("unitPrefix")} {v.unit.number}</div>
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
                                            {isGuard && v.status === "DEPARTED" && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-500"
                                                    onClick={() => handleDeleteVisitor(v.id)}
                                                    icon="delete"
                                                >
                                                    {t("deleteRecord")}
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
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchVisitors();
                    }}
                />
            </Modal>
        </div>
    );
}

"use client";

import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { useTranslations } from "next-intl";

interface OperatorDashboardProps {
    data: {
        totalUnits: number;
        totalResidents: number;
        occupiedUnits: number;
        pendingReservations: number;
    };
}

export function OperatorDashboard({ data }: OperatorDashboardProps) {
    const t = useTranslations("Dashboard");

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon="door_front"
                    label={t("totalUnits")}
                    value={data.totalUnits.toString()}
                    subtitle={t("inComplex")}
                    iconBgColor="bg-indigo-50 dark:bg-indigo-900/20"
                    iconColor="text-indigo-600"
                />
                <StatCard
                    icon="group"
                    label={t("activeResidents")}
                    value={data.totalResidents.toString()}
                    subtitle={t("inComplex")}
                    iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
                    iconColor="text-emerald-600"
                />
                <StatCard
                    icon="pie_chart"
                    label={t("occupancy")}
                    value={data.occupiedUnits.toString()}
                    subtitle={t("unitsOccupied")}
                    iconBgColor="bg-orange-50 dark:bg-orange-900/20"
                    iconColor="text-orange-500"
                />
                <StatCard
                    icon="event_note"
                    label={t("pendingReservations")}
                    value={data.pendingReservations.toString()}
                    subtitle={t("toReview")}
                    iconBgColor="bg-amber-50 dark:bg-amber-900/20"
                    iconColor="text-amber-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                    <h3 className="font-bold mb-4">{t("operatorDashboard.todayVisitors")}</h3>
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">no_accounts</span>
                        <p className="text-sm text-slate-500">No hay ingresos registrados hoy.</p>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-bold mb-4">{t("operatorDashboard.recentIncidents")}</h3>
                    <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">report_off</span>
                        <p className="text-sm text-slate-500">No hay incidentes reportados recientemente.</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

"use client";

import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/Badge";
import { Link } from '@/i18n/routing';
import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { Role } from '@/types/roles';
import { motion } from "framer-motion";

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

interface OperatorDashboardProps {
    data: {
        totalUnits: number;
        totalResidents: number;
        occupiedUnits: number;
        pendingReservations: number;
        recentIncidents: any[];
        activities: any[];
        complexSettings?: any;
    };
}

export function OperatorDashboard({ data }: OperatorDashboardProps) {
    const t = useTranslations("Dashboard");

    const hasPermission = (module: string) => {
        // Enforce Guard Role by default if it's an operator
        const permissions = data.complexSettings?.permissions?.[Role.GUARD];
        if (!permissions) return true; // Default true
        return permissions[module] !== false; // Explicit false
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <motion.div variants={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                {hasPermission('reservations') && (
                    <StatCard
                        icon="event_note"
                        label={t("pendingReservations")}
                        value={data.pendingReservations.toString()}
                        subtitle={t("toReview")}
                        iconBgColor="bg-amber-50 dark:bg-amber-900/20"
                        iconColor="text-amber-500"
                    />
                )}
            </motion.div>

            <motion.div variants={container} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div variants={{ hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } }} className="lg:col-span-2">
                    <ActivityTable activities={data.activities || []} />
                </motion.div>
                {hasPermission('accessControl') && (
                    <motion.div variants={{ hidden: { opacity: 0, x: 20 }, show: { opacity: 1, x: 0 } }} className="lg:col-span-1 border-slate-200 dark:border-slate-800">
                        <Card className="p-6 h-full">
                            <h3 className="font-bold mb-4">{t("operatorDashboard.todayVisitors")}</h3>
                            <div className="text-center py-12 bg-slate-50 dark:bg-background-dark/50 rounded-lg">
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">no_accounts</span>
                                <p className="text-sm text-slate-500">{t("operatorDashboard.noVisitorsToday")}</p>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </motion.div>
        </motion.div>
    );
}

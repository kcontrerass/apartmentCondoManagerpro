"use client";

import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { StatCard } from "@/components/dashboard/StatCard";
import { useTranslations } from 'next-intl';
import { formatPrice } from "@/lib/utils";

interface DashboardStats {
    totalComplexes: number;
    totalUnits: number;
    totalResidents: number;
    occupancyRate: number;
    occupiedUnits: number;
    vacantUnits: number;
    pendingIncidents: number;
    recentActivities: any[];
}

interface DashboardClientProps {
    stats: DashboardStats;
}

export function DashboardClient({ stats }: DashboardClientProps) {
    const t = useTranslations('Dashboard');

    const activities = stats.recentActivities;

    const occupancyData = {
        residents: stats.occupiedUnits,
        vacant: stats.vacantUnits,
    };

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon="domain"
                    label={t('totalComplexes')}
                    value={stats.totalComplexes.toString()}
                    subtitle={t('managedCurrently')}
                    iconBgColor="bg-indigo-50 dark:bg-indigo-900/20"
                    iconColor="text-indigo-600"
                />
                <StatCard
                    icon="door_front"
                    iconBgColor="bg-orange-50 dark:bg-orange-900/20"
                    iconColor="text-orange-500"
                    label={t('totalUnits')}
                    value={stats.totalUnits.toString()}
                    subtitle={t('allComplexes')}
                />
                <StatCard
                    icon="group"
                    iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
                    iconColor="text-emerald-600"
                    label={t('activeResidents')}
                    value={stats.totalResidents.toString()}
                    subtitle={t('registeredSystem')}
                />
                <StatCard
                    icon="report"
                    label="Incidentes Pendientes"
                    value={stats.pendingIncidents.toString()}
                    subtitle="Por resolver"
                    iconBgColor="bg-red-50 dark:bg-red-900/20"
                    iconColor="text-red-500"
                    badge={stats.pendingIncidents > 0 ? { text: "Acción requerida", variant: "error" } : undefined}
                />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <ActivityTable activities={activities} />
                </div>
                <div className="lg:col-span-1 h-full">
                    <OccupancyChart data={occupancyData} totalUnits={stats.totalUnits || 100} />
                </div>
            </div>
        </div>
    );
}

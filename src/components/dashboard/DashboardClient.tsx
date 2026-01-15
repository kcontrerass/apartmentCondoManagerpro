"use client";

import { ActivityTable } from "@/components/dashboard/ActivityTable";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { StatCard } from "@/components/dashboard/StatCard";

interface DashboardStats {
    totalComplexes: number;
    totalUnits: number;
    totalResidents: number;
    occupancyRate: number;
    occupiedByOwner: number;
    occupiedByTenant: number;
    vacantUnits: number;
}

interface DashboardClientProps {
    stats: DashboardStats;
}

export function DashboardClient({ stats }: DashboardClientProps) {
    const activities = [
        {
            reference: 'Unit 402',
            type: 'Maintenance Fee',
            status: { label: 'Paid', variant: 'success' as const },
            datetime: 'Today, 11:30 AM',
            details: '$250.00',
        },
        {
            reference: 'Unit 105',
            type: 'Amenity Reservation',
            status: { label: 'Pending', variant: 'warning' as const },
            datetime: 'Today, 09:15 AM',
            details: '$50.00',
        },
        {
            reference: 'Visitor Log',
            type: 'Access Control',
            status: { label: 'Logged', variant: 'info' as const },
            datetime: 'Today, 08:45 AM',
            details: 'John Doe',
        },
        {
            reference: 'Unit 203',
            type: 'Incident Report',
            status: { label: 'Urgent', variant: 'warning' as const },
            datetime: 'Yesterday, 16:20 PM',
            details: '#INC-2023-001',
        },
        {
            reference: 'Unit 501',
            type: 'Monthly Fee',
            status: { label: 'Paid', variant: 'success' as const },
            datetime: 'Yesterday, 10:00 AM',
            details: '$250.00',
        },
    ];

    const occupancyData = {
        owners: stats.occupiedByOwner,
        tenants: stats.occupiedByTenant,
        vacant: stats.vacantUnits,
    };

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon="apartment"
                    label="Total Complejos"
                    value={stats.totalComplexes.toString()}
                    subtitle="Gestionados actualmente"
                    iconBgColor="bg-indigo-50 dark:bg-indigo-900/20"
                    iconColor="text-indigo-600"
                />
                <StatCard
                    icon="door_front"
                    iconBgColor="bg-orange-50 dark:bg-orange-900/20"
                    iconColor="text-orange-500"
                    label="Total Unidades"
                    value={stats.totalUnits.toString()}
                    subtitle="En todos los complejos"
                />
                <StatCard
                    icon="group"
                    iconBgColor="bg-emerald-50 dark:bg-emerald-900/20"
                    iconColor="text-emerald-600"
                    label="Residentes Activos"
                    value={stats.totalResidents.toString()}
                    subtitle="Registrados en el sistema"
                />
                <StatCard
                    icon="pie_chart"
                    label="Ocupación"
                    value={`${Math.round(stats.occupancyRate)}%`}
                    subtitle="Promedio general"
                    iconBgColor="bg-purple-50 dark:bg-purple-900/20"
                    iconColor="text-purple-500"
                    badge={{ text: 'En tiempo real', variant: 'info' }}
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

"use client";

import { useTranslations } from 'next-intl';
import { RevenueChart } from './RevenueChart';
import { IncidentsChart } from './IncidentsChart';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';

interface ReportsClientProps {
    data: {
        revenueData: { month: string; total: number }[];
        incidentsData: { status: string; count: number; color: string }[];
        stats: {
            totalRevenue: number;
            totalIncidents: number;
            resolvedRate: number;
            occupancyRate: number;
        }
    }
}

export function ReportsClient({ data }: ReportsClientProps) {
    const t = useTranslations('Dashboard');

    return (
        <div className="space-y-8">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <p className="text-indigo-100 text-sm font-medium mb-1">Ingresos Totales (6m)</p>
                    <h3 className="text-2xl font-bold">{formatPrice(data.stats.totalRevenue)}</h3>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <p className="text-emerald-100 text-sm font-medium mb-1">Ocupación</p>
                    <h3 className="text-2xl font-bold">{data.stats.occupancyRate}%</h3>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                    <p className="text-amber-100 text-sm font-medium mb-1">Incidentes</p>
                    <h3 className="text-2xl font-bold">{data.stats.totalIncidents}</h3>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-rose-500 to-rose-600 text-white">
                    <p className="text-rose-100 text-sm font-medium mb-1">Resolución</p>
                    <h3 className="text-2xl font-bold">{data.stats.resolvedRate}%</h3>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RevenueChart data={data.revenueData} />
                <IncidentsChart data={data.incidentsData} />
            </div>
        </div>
    );
}

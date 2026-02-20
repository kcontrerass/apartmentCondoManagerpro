"use client";

import { useTranslations } from 'next-intl';
import { RevenueChart } from './RevenueChart';
import { IncidentsChart } from './IncidentsChart';
import { AmenitiesPopularityChart } from './AmenitiesPopularityChart';
import { VisitorTrendsChart } from './VisitorTrendsChart';
import { Card } from '@/components/ui/Card';
import { formatPrice } from '@/lib/utils';
import { useRouter, usePathname } from '@/i18n/routing';
import { Role } from '@/types/roles';

interface ReportsClientProps {
    data: {
        revenueData: { month: string; total: number }[];
        incidentsData: { statusKey: string; count: number; color: string }[];
        reservationsByAmenity: { name: string; count: number }[];
        visitorTrends: { date: string; count: number }[];
        stats: {
            totalRevenue: number;
            totalIncidents: number;
            resolvedRate: number;
            occupancyRate: number;
        }
    };
    complexes: { id: string; name: string }[];
    selectedComplexId?: string;
    userRole: string;
}

export function ReportsClient({ data, complexes, selectedComplexId, userRole }: ReportsClientProps) {
    const t = useTranslations('Reports');
    const router = useRouter();
    const pathname = usePathname();

    const localizedRevenueData = data.revenueData.map(d => ({
        ...d,
        month: t(`months.${d.month}`)
    }));

    const localizedIncidentsData = data.incidentsData.map(d => ({
        status: t(`incidentsStatus.${d.statusKey}`),
        count: d.count,
        color: d.color
    }));

    const handleComplexChange = (id: string) => {
        const params = new URLSearchParams();
        if (id !== 'all') {
            params.set('complexId', id);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Filter Section */}
            {(userRole === Role.SUPER_ADMIN || complexes.length > 1) && (
                <div className="flex justify-end">
                    <div className="w-full md:w-64">
                        <label htmlFor="complex-select" className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wider">
                            {t('filterByComplex')}
                        </label>
                        <select
                            id="complex-select"
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                            value={selectedComplexId || 'all'}
                            onChange={(e) => handleComplexChange(e.target.value)}
                        >
                            <option value="all">{t('allComplexes')}</option>
                            {complexes.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
                    <p className="text-indigo-100 text-sm font-medium mb-1">{t('stats.totalRevenue')}</p>
                    <h3 className="text-2xl font-bold">{formatPrice(data.stats.totalRevenue)}</h3>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <p className="text-emerald-100 text-sm font-medium mb-1">{t('stats.occupancy')}</p>
                    <h3 className="text-2xl font-bold">{data.stats.occupancyRate}%</h3>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-amber-500 to-amber-600 text-white">
                    <p className="text-amber-100 text-sm font-medium mb-1">{t('stats.incidents')}</p>
                    <h3 className="text-2xl font-bold">{data.stats.totalIncidents}</h3>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-rose-500 to-rose-600 text-white">
                    <p className="text-rose-100 text-sm font-medium mb-1">{t('stats.resolution')}</p>
                    <h3 className="text-2xl font-bold">{data.stats.resolvedRate}%</h3>
                </Card>
            </div>

            {/* Charts Grid - High Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RevenueChart data={localizedRevenueData} />
                <VisitorTrendsChart data={data.visitorTrends} />
            </div>

            {/* Charts Grid - Secondary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <AmenitiesPopularityChart data={data.reservationsByAmenity} />
                </div>
                <div className="lg:col-span-1">
                    <IncidentsChart data={localizedIncidentsData} />
                </div>
            </div>
        </div>
    );
}

"use client";

import Link from 'next/link';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { useTranslations } from 'next-intl';

ChartJS.register(ArcElement, Tooltip, Legend);

interface OccupancyData {
    residents: number;
    vacant: number;
}

interface OccupancyChartProps {
    data: OccupancyData;
    totalUnits: number;
}

export function OccupancyChart({ data, totalUnits }: OccupancyChartProps) {
    const t = useTranslations('Dashboard');
    const total = totalUnits || 1;
    const occupancyRate = Math.round((data.residents / total) * 100);

    const chartData = {
        labels: [t('occupancy.residents'), t('occupancy.vacant')],
        datasets: [
            {
                data: [data.residents, data.vacant],
                backgroundColor: [
                    '#005780', // Residentes
                    '#262B28', // Vacíos
                    '#1a1e1c', // Mantenimiento
                ],
                borderWidth: 0,
                hoverOffset: 4,
            },
        ],
    };

    const options = {
        cutout: '75%',
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                backgroundColor: '#1e293b',
                padding: 12,
                cornerRadius: 8,
                displayColors: false,
            },
        },
        maintainAspectRatio: false,
        responsive: true,
    };

    return (
        <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col h-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                {t('occupancy.title')}
            </h3>

            {/* Chart */}
            <div className="flex-1 flex items-center justify-center min-h-[250px] relative mb-6">
                <div className="w-[220px] h-[220px] relative">
                    <Doughnut data={chartData} options={options} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {occupancyRate}%
                        </span>
                        <span className="text-sm text-slate-500 font-medium mt-1">{t('occupancy.label')}</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="space-y-4 mt-auto">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary ring-2 ring-primary/20"></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {t('occupancy.residents')} ({Math.round((data.residents / totalUnits) * 100)}%)
                        </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {data.residents} {t('occupancy.units')}
                    </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-slate-200 ring-2 ring-slate-200"></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Vacantes ({Math.round((data.vacant / totalUnits) * 100)}%)
                        </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {data.vacant} Unidades
                    </span>
                </div>
            </div>

            <Link href="/dashboard/reports" className="w-full mt-6 block">
                <button className="w-full py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    {t('occupancy.viewReport')}
                </button>
            </Link>
        </div>
    );
}

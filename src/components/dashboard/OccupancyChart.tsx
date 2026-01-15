"use client";

import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface OccupancyData {
    owners: number;
    tenants: number;
    vacant: number;
}

interface OccupancyChartProps {
    data: OccupancyData;
    totalUnits: number;
}

export function OccupancyChart({ data, totalUnits }: OccupancyChartProps) {
    const total = totalUnits || 1;
    const occupancyRate = Math.round(((data.owners + data.tenants) / total) * 100);

    const chartData = {
        labels: ['Owners', 'Tenants', 'Vacant'],
        datasets: [
            {
                data: [data.owners, data.tenants, data.vacant],
                backgroundColor: ['#135bec', '#10b981', '#e2e8f0'],
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
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col h-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                Occupancy Status
            </h3>

            {/* Chart */}
            <div className="flex-1 flex items-center justify-center min-h-[250px] relative mb-6">
                <div className="w-[220px] h-[220px] relative">
                    <Doughnut data={chartData} options={options} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {occupancyRate}%
                        </span>
                        <span className="text-sm text-slate-500 font-medium mt-1">Occupied</span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="space-y-4 mt-auto">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary ring-2 ring-primary/20"></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Owners ({Math.round((data.owners / totalUnits) * 100)}%)
                        </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {data.owners} Units
                    </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Tenants ({Math.round((data.tenants / totalUnits) * 100)}%)
                        </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {data.tenants} Units
                    </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-slate-200 ring-2 ring-slate-200"></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Vacant ({Math.round((data.vacant / totalUnits) * 100)}%)
                        </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {data.vacant} Units
                    </span>
                </div>
            </div>

            <button className="w-full mt-6 py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                View Detailed Report
            </button>
        </div>
    );
}

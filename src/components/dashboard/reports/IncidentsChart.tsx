"use client";

import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface IncidentsChartProps {
    data: {
        status: string;
        count: number;
        color: string;
    }[];
}

export function IncidentsChart({ data }: IncidentsChartProps) {
    const chartData = {
        labels: data.map(d => d.status),
        datasets: [
            {
                data: data.map(d => d.count),
                backgroundColor: data.map(d => d.color),
                borderWidth: 0,
                hoverOffset: 4,
            },
        ],
    };

    const options = {
        cutout: '70%',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12
                    }
                }
            },
        },
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Estado de Incidentes</h3>
            <div className="h-[300px] relative">
                <Doughnut data={chartData} options={options} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                    <div className="text-center">
                        <span className="block text-3xl font-bold text-slate-900 dark:text-white">
                            {data.reduce((acc, curr) => acc + curr.count, 0)}
                        </span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider">Total</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

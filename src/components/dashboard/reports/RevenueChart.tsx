"use client";

import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { formatPrice } from '@/lib/utils';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface RevenueChartProps {
    data: {
        month: string;
        total: number;
    }[];
}

export function RevenueChart({ data }: RevenueChartProps) {
    const chartData = {
        labels: data.map(d => d.month),
        datasets: [
            {
                label: 'Ingresos',
                data: data.map(d => d.total),
                backgroundColor: '#135bec',
                borderRadius: 8,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: (context: any) => {
                        return `Total: ${formatPrice(context.raw)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    display: false,
                },
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Ingresos Mensuales</h3>
            <div className="h-[300px]">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
}

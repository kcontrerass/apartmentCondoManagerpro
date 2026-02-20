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
import { useTranslations } from 'next-intl';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface AmenitiesPopularityChartProps {
    data: {
        name: string;
        count: number;
    }[];
}

export function AmenitiesPopularityChart({ data }: AmenitiesPopularityChartProps) {
    const t = useTranslations('Reports');

    const chartData = {
        labels: data.map(d => d.name),
        datasets: [
            {
                label: t('charts.amenities.label'),
                data: data.map(d => d.count),
                backgroundColor: '#8b5cf6', // Violet
                borderRadius: 8,
            },
        ],
    };

    const options = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: {
                    display: false,
                },
            },
            y: {
                grid: {
                    display: false,
                },
            },
        },
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">{t('charts.amenities.title')}</h3>
            <div className="h-[300px]">
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
}

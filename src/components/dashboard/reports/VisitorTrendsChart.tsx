"use client";

import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import { useLocale } from 'next-intl';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface VisitorTrendsChartProps {
    data: {
        date: string;
        count: number;
    }[];
}

export function VisitorTrendsChart({ data }: VisitorTrendsChartProps) {
    const t = useTranslations('Reports');
    const localeString = useLocale();
    const dateLocale = localeString === 'es' ? es : enUS;

    const chartData = {
        labels: data.map(d => format(new Date(d.date), 'EEE dd', { locale: dateLocale })),
        datasets: [
            {
                label: t('charts.visitors.label'),
                data: data.map(d => d.count),
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: '#3b82f6',
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#3b82f6',
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
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1,
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
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
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">{t('charts.visitors.title')}</h3>
            <div className="h-[300px]">
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
}

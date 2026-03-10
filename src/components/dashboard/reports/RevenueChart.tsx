import { useRef, forwardRef, useImperativeHandle } from 'react';
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
import { useTranslations } from 'next-intl';

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

export const RevenueChart = forwardRef((props: RevenueChartProps, ref) => {
    const { data } = props;
    const t = useTranslations('Reports');
    const chartRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        getChartImage: () => {
            return chartRef.current?.toBase64Image();
        }
    }));

    const downloadChart = () => {
        if (!chartRef.current) return;
        const link = document.createElement('a');
        link.download = `ingresos_${new Date().toISOString().split('T')[0]}.png`;
        link.href = chartRef.current.toBase64Image();
        link.click();
    };

    const chartData = {
        labels: data.map(d => d.month),
        datasets: [
            {
                label: t('charts.revenue.label'),
                data: data.map(d => d.total),
                backgroundColor: '#005780',
                borderColor: '#005780',
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
                        return `${t('charts.revenue.label')}: ${formatPrice(context.raw)}`;
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
        <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('charts.revenue.title')}</h3>
                <button
                    onClick={downloadChart}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-primary group relative"
                    title="Descargar como imagen"
                >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
            </div>
            <div className="h-[300px] flex-1">
                <Bar ref={chartRef} data={chartData} options={options} />
            </div>
        </div>
    );
});

RevenueChart.displayName = 'RevenueChart';

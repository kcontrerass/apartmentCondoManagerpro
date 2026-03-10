import { useRef, forwardRef, useImperativeHandle } from 'react';
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

export const VisitorTrendsChart = forwardRef((props: VisitorTrendsChartProps, ref) => {
    const { data } = props;
    const t = useTranslations('Reports');
    const localeString = useLocale();
    const chartRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        getChartImage: () => {
            return chartRef.current?.toBase64Image();
        }
    }));

    const downloadChart = () => {
        if (!chartRef.current) return;
        const link = document.createElement('a');
        link.download = `visitantes_${new Date().toISOString().split('T')[0]}.png`;
        link.href = chartRef.current.toBase64Image();
        link.click();
    };

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
        <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('charts.visitors.title')}</h3>
                <button
                    onClick={downloadChart}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-primary group relative"
                    title="Descargar como imagen"
                >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
            </div>
            <div className="h-[300px] flex-1">
                <Line ref={chartRef} data={chartData} options={options} />
            </div>
        </div>
    );
});

VisitorTrendsChart.displayName = 'VisitorTrendsChart';

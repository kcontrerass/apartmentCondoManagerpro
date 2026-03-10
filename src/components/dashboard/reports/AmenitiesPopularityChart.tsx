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

export const AmenitiesPopularityChart = forwardRef((props: AmenitiesPopularityChartProps, ref) => {
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
        link.download = `popularidad_amenidades_${new Date().toISOString().split('T')[0]}.png`;
        link.href = chartRef.current.toBase64Image();
        link.click();
    };

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
        <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('charts.amenities.title')}</h3>
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

AmenitiesPopularityChart.displayName = 'AmenitiesPopularityChart';

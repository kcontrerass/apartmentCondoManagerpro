import { useRef, forwardRef, useImperativeHandle } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { useTranslations } from 'next-intl';

ChartJS.register(ArcElement, Tooltip, Legend);

interface IncidentsChartProps {
    data: {
        status: string;
        count: number;
        color: string;
    }[];
}

export const IncidentsChart = forwardRef((props: IncidentsChartProps, ref) => {
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
        link.download = `incidentes_${new Date().toISOString().split('T')[0]}.png`;
        link.href = chartRef.current.toBase64Image();
        link.click();
    };

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
        <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{t('charts.incidents.title')}</h3>
                <button
                    onClick={downloadChart}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-primary group relative"
                    title="Descargar como imagen"
                >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                </button>
            </div>
            <div className="h-[300px] relative flex-1">
                <Doughnut ref={chartRef} data={chartData} options={options} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                    <div className="text-center">
                        <span className="block text-3xl font-bold text-slate-900 dark:text-white">
                            {data.reduce((acc, curr) => acc + curr.count, 0)}
                        </span>
                        <span className="text-xs text-slate-500 uppercase tracking-wider">{t('charts.incidents.total')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

IncidentsChart.displayName = 'IncidentsChart';

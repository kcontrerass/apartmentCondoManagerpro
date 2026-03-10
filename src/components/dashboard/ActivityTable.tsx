import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTranslations } from 'next-intl';

interface Activity {
    reference: string;
    type: string;
    status: {
        label: string;
        variant: 'success' | 'warning' | 'info' | 'neutral';
    };
    datetime: string | Date;
    details: string;
    href?: string;
}

interface ActivityTableProps {
    activities: Activity[];
    onViewAll?: () => void;
}

const statusStyles = {
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    neutral: 'bg-slate-100 text-slate-800 dark:bg-background-dark dark:text-slate-300',
};

export function ActivityTable({ activities, onViewAll }: ActivityTableProps) {
    const t = useTranslations('Dashboard');

    return (
        <div className="bg-white dark:bg-background-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-background-dark shrink-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {t('activity.title')}
                </h3>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-sm text-primary font-medium hover:text-primary-dark transition-colors inline-flex items-center gap-1 group"
                    >
                        {t('activity.viewAll')}
                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-background-dark/50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">{t('activity.reference')}</th>
                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">{t('activity.type')}</th>
                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider">{t('activity.status')}</th>
                            <th className="px-6 py-3 font-semibold text-xs uppercase tracking-wider hidden sm:table-cell">{t('activity.datetime')}</th>
                            <th className="px-6 py-3 font-semibold text-right text-xs uppercase tracking-wider">{t('activity.details')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {activities.map((activity, index) => {
                            const Content = (
                                <>
                                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-[150px] truncate">
                                        {activity.reference}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">
                                        {activity.type}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", statusStyles[activity.status.variant])}>
                                            {activity.status.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 hidden sm:table-cell">
                                        {format(new Date(activity.datetime), "dd/MM/yyyy HH:mm", { locale: es })}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500 font-mono text-xs">
                                        {activity.details}
                                    </td>
                                </>
                            );

                            return (
                                <tr
                                    key={index}
                                    className={cn(
                                        "transition-colors",
                                        activity.href ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                                    )}
                                    onClick={() => activity.href && (window.location.href = activity.href)}
                                >
                                    {Content}
                                </tr>
                            );
                        })}
                        {activities.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    No hay actividad reciente para mostrar.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

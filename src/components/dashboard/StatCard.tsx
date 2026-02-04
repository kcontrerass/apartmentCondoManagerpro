import { cn } from "@/lib/utils";

interface StatCardProps {
    icon: string;
    iconBgColor?: string;
    iconColor?: string;
    label: string;
    value: string | number;
    subtitle?: string;
    badge?: {
        text: string;
        variant: 'success' | 'warning' | 'info' | 'neutral' | 'error';
    };
}

const badgeStyles = {
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function StatCard({
    icon,
    iconBgColor = 'bg-blue-50 dark:bg-blue-900/20',
    iconColor = 'text-primary',
    label,
    value,
    subtitle,
    badge,
}: StatCardProps) {
    return (
        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-lg", iconBgColor)}>
                    <span className={cn("material-symbols-outlined text-[24px]", iconColor)}>
                        {icon}
                    </span>
                </div>
                {badge && (
                    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", badgeStyles[badge.variant])}>
                        {badge.text}
                    </span>
                )}
            </div>

            {/* Content */}
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                {label}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {value}
            </h3>
            {subtitle && (
                <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            )}
        </div>
    );
}

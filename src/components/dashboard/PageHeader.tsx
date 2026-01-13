import { ReactNode } from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
            <div className="min-w-0">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3 shrink-0 self-start md:self-auto overflow-x-auto max-w-full pb-1 md:pb-0">
                    {actions}
                </div>
            )}
        </div>
    );
}

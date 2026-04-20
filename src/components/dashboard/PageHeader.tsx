import { ReactNode } from 'react';

interface PageHeaderProps {
    title: ReactNode;
    subtitle?: ReactNode;
    actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 w-full">
            <div className="min-w-0">
                <h1 className="text-2xl font-bold text-foreground tracking-tight truncate font-malik">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-slate-500 mt-1 truncate font-akrobat">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && (
                <div className="flex w-full min-w-0 flex-col gap-3 sm:w-auto sm:shrink-0 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                    {actions}
                </div>
            )}
        </div>
    );
}

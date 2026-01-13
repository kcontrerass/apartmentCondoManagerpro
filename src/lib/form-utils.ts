import { FieldErrors } from 'react-hook-form';

export function getErrorMessage(errors: FieldErrors, field: string): string | undefined {
    const message = errors[field]?.message;
    return typeof message === 'string' ? message : undefined;
}

export const formStyles = {
    label: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1",
    input: "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all",
    error: "text-xs text-red-500 mt-1",
    group: "space-y-1",
};

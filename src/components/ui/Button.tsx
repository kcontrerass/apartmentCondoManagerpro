import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    icon?: string;
    iconPosition?: 'left' | 'right';
    isLoading?: boolean;
}

export function Button({
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'left',
    isLoading = false,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    const variants = {
        primary: 'bg-primary text-white hover:bg-primary-dark shadow-sm hover:shadow',
        secondary: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
        ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
        danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
        outline: 'border border-slate-200 bg-transparent hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10 p-2 text-sm justify-center'
    };

    return (
        <button
            disabled={disabled || isLoading}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/20 active:scale-95',
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {isLoading && (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
            )}
            {!isLoading && icon && iconPosition === 'left' && (
                <span className="material-symbols-outlined text-[20px] leading-none select-none">{icon}</span>
            )}
            {children}
            {!isLoading && icon && iconPosition === 'right' && (
                <span className="material-symbols-outlined text-[20px] leading-none select-none">{icon}</span>
            )}
        </button>
    );
}

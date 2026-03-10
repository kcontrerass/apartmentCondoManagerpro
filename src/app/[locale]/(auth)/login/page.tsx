'use client';

import { useActionState } from 'react';
import { authenticate } from '@/lib/actions/auth-actions';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [errorMessage, formAction, isPending] = useActionState(
        authenticate,
        undefined
    );

    return (
        <form action={formAction} className="space-y-6">
            <div>
                <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                    Correo Electrónico
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50/50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary dark:text-white transition-all duration-200"
                        placeholder="tu@correo.com"
                    />
                </div>
            </div>

            <div>
                <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                >
                    Contraseña
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                    </div>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-50/50 dark:bg-background-dark/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary dark:text-white transition-all duration-200"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center">
                    <input
                        id="remember_me"
                        name="remember_me"
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/50 bg-white dark:bg-background-dark dark:border-slate-600 transition-colors cursor-pointer"
                    />
                    <label
                        htmlFor="remember_me"
                        className="ml-2 block text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none"
                    >
                        Recordarme
                    </label>
                </div>

                <div className="text-sm">
                    <Link
                        href="/forgot-password"
                        className="font-medium text-primary hover:text-primary-dark dark:text-primary dark:hover:text-primary/80 transition-colors"
                    >
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
            </div>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex w-full justify-center items-center gap-2 rounded-xl border border-transparent bg-primary px-4 py-3 text-sm font-bold text-white shadow-md shadow-primary/20 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
                >
                    {isPending ? (
                        <>
                            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                            Iniciando sesión...
                        </>
                    ) : 'Ingresar al Portal'}
                </button>
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                    ¿Nuevo en ADESSO?{' '}
                    <a
                        href="/register"
                        className="font-bold text-primary hover:text-primary-dark dark:text-primary dark:hover:text-primary/80 transition-colors"
                    >
                        Regístrate aquí
                    </a>
                </p>
            </div>
            <div
                className="flex h-8 items-end space-x-1"
                aria-live="polite"
                aria-atomic="true"
            >
                {errorMessage && (
                    <p className="text-sm text-red-500">{errorMessage}</p>
                )}
            </div>
        </form>
    );
}

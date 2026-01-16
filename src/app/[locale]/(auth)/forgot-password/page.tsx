'use client';

import { useActionState } from 'react';
import { forgotPasswordAction } from '@/lib/actions/auth-actions';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function ForgotPasswordPage() {
    const [state, formAction, isPending] = useActionState(forgotPasswordAction, undefined);
    const [email, setEmail] = useState('');

    return (
        <form action={formAction} className="space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Reset your password
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            {state?.message && (
                <div className={cn(
                    "p-3 rounded-md text-sm font-medium",
                    state.success ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                )}>
                    {state.message}
                </div>
            )}

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email address
                </label>
                <div className="mt-1">
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                        placeholder="you@example.com"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
                {isPending ? (
                    <span className="flex items-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Sending...
                    </span>
                ) : (
                    'Send Reset Link'
                )}
            </button>

            <div className="text-center">
                <Link
                    href="/login"
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                    Back to login
                </Link>
            </div>
        </form>
    );
}

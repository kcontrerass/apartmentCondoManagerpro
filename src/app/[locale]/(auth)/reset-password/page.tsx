'use client';

import { useActionState, Suspense } from 'react';
import { resetPasswordAction } from '@/lib/actions/auth-actions';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useState } from 'react';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [state, formAction, isPending] = useActionState(resetPasswordAction, undefined);

    // Controlled inputs for password mismatch validation visual feedback if needed
    // but relying on server action validation is safer.

    if (!token) {
        return (
            <div className="text-center">
                <div className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 p-4 rounded-md mb-4">
                    Invalid request. Missing reset token.
                </div>
                <Link href="/forgot-password" className="text-primary hover:underline">
                    Request a new password reset link
                </Link>
            </div>
        );
    }

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="token" value={token} />

            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Set new password
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Please enter your new password below.
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

            {state?.success && (
                <div className="text-center">
                    <Link
                        href="/login"
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                        Go to login page
                    </Link>
                </div>
            )}

            {!state?.success && (
                <>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            New Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Confirm Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={6}
                                className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-white"
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
                                Resetting...
                            </span>
                        ) : (
                            'Reset Password'
                        )}
                    </button>
                </>
            )}
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="text-center">Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}

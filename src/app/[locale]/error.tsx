'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl text-red-500">error</span>
                </div>

                <h2 className="text-3xl font-bold tracking-tight">Something went wrong!</h2>

                <p className="text-slate-500 dark:text-slate-400">
                    An unexpected error occurred. We've been notified and are working to fix it.
                </p>

                <div className="pt-6 flex gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors"
                    >
                        Try again
                    </button>
                    <a
                        href="/dashboard"
                        className="px-6 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Go to Dashboard
                    </a>
                </div>
            </div>
        </div>
    );
}

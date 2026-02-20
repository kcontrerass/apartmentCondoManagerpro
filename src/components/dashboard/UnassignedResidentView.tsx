"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { signOut } from "next-auth/react";

export function UnassignedResidentView() {
    const t = useTranslations('Unassigned');

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
                <div className="relative w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/20">
                    <span className="material-symbols-outlined text-5xl text-primary animate-pulse">
                        person_search
                    </span>
                </div>
            </div>

            <div className="max-w-md space-y-3">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {t('title')}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                    {t('message')}
                </p>
            </div>

            <div className="w-full max-w-lg bg-slate-50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-primary">info</span>
                    {t('subtitle')}
                </h2>

                <ul className="space-y-4 text-left">
                    {[1, 2, 3].map((i) => (
                        <li key={i} className="flex gap-4 items-start group">
                            <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-1 font-bold transition-transform group-hover:scale-110">
                                {i}
                            </div>
                            <span className="text-slate-600 dark:text-slate-400 leading-relaxed">
                                {t(`instruction${i}` as any)}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <Button
                variant="outline"
                size="lg"
                onClick={() => signOut({ callbackUrl: '/' })}
                icon="logout"
                className="hover:bg-primary/5 border-primary/20"
            >
                {t('logout')}
            </Button>
        </div>
    );
}

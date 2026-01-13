"use client";

import { Button } from "@/components/ui/Button";

export function Header() {
    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between sticky top-0 z-30 ml-64">
            {/* Complex Selector */}
            <button className="flex items-center gap-2 text-slate-900 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-slate-500">domain</span>
                <span>Sunset Towers - Block A</span>
                <span className="material-symbols-outlined text-slate-400">expand_more</span>
            </button>

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-8">
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                    </span>
                    <input
                        type="search"
                        placeholder="Search unit, resident, or tag..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">notifications</span>
                </Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600">
                    <span className="material-symbols-outlined">help</span>
                </Button>

            </div>
        </header>
    );
}

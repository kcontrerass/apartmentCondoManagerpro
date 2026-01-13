"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navSections = [
    {
        label: 'Main',
        items: [
            { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
            { icon: 'domain', label: 'Complexes', href: '/dashboard/complexes' },
            { icon: 'door_front', label: 'Units', href: '/dashboard/units' },
            { icon: 'group', label: 'Neighbors', href: '/dashboard/residents' },
        ],
    },
    {
        label: 'Management',
        items: [
            { icon: 'pool', label: 'Amenities', href: '/dashboard/amenities' },
            { icon: 'handyman', label: 'Services', href: '/dashboard/services' },
            { icon: 'payments', label: 'Billing', href: '/dashboard/billing' },
            { icon: 'badge', label: 'Access Control', href: '/dashboard/access' },
        ],
    },
    {
        label: 'Support',
        items: [
            { icon: 'forum', label: 'Communications', href: '/dashboard/communications' },
            { icon: 'warning', label: 'Incidents', href: '/dashboard/incidents', badge: 3 },
            { icon: 'bar_chart', label: 'Reports', href: '/dashboard/reports' },
            { icon: 'description', label: 'Documents', href: '/dashboard/documents' },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 fixed left-0 top-0 z-40">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30">
                    <span className="material-symbols-outlined text-[20px]">apartment</span>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-slate-900 dark:text-white text-base font-bold leading-none tracking-tight">
                        CondoManager
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
                        Admin Console
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {navSections.map((section) => (
                    <div key={section.label}>
                        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6 first:mt-2">
                            {section.label}
                        </p>
                        {section.items.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                                        isActive
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                    )}
                                >
                                    <span className={cn(
                                        "material-symbols-outlined text-[20px] transition-transform duration-200",
                                        !isActive && "group-hover:scale-110"
                                    )}>
                                        {item.icon}
                                    </span>
                                    <div className="flex justify-between items-center w-full">
                                        <span className="text-sm">{item.label}</span>
                                        {/* @ts-expect-error - badge is optional */}
                                        {item.badge && (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600 animate-in zoom-in">
                                                {/* @ts-expect-error - badge is optional */}
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>

                                    {isActive && (
                                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                        JA
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                            James Anderson
                        </p>
                        <p className="text-xs text-slate-500 truncate">Super Admin</p>
                    </div>
                    <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">settings</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}

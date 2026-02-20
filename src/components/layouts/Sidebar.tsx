"use client";

import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { Role } from "@/types/roles";

export function Sidebar({ user, complexName }: { user?: { name?: string | null; role?: string; image?: string | null }; complexName?: string | null }) {
    const pathname = usePathname();
    const t = useTranslations('Common');
    const locale = useLocale();

    const navSections: {
        label: string;
        items: {
            icon: string;
            label: string;
            href: string;
            roles?: Role[];
            badge?: string | number
        }[]
    }[] = [
            {
                label: t('main'),
                items: [
                    { icon: 'dashboard', label: t('dashboard'), href: '/dashboard', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS, Role.RESIDENT, Role.GUARD] },
                    { icon: 'apartment', label: t('complexes'), href: '/dashboard/complexes', roles: [Role.SUPER_ADMIN] },
                    { icon: 'monitoring', label: t('reports'), href: '/dashboard/reports', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS] },
                ],
            },
            {
                label: t('management'),
                items: [
                    { icon: 'door_front', label: t('units'), href: '/dashboard/units', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS, Role.GUARD] },
                    { icon: 'group', label: t('residents'), href: '/dashboard/residents', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS, Role.GUARD] },
                    { icon: 'pool', label: t('amenities'), href: '/dashboard/amenities', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS, Role.RESIDENT, Role.GUARD] },
                    { icon: 'event_available', label: t('reservations'), href: '/dashboard/reservations', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS, Role.RESIDENT] },
                    { icon: 'handyman', label: t('services'), href: '/dashboard/services', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS, Role.GUARD, Role.RESIDENT] },
                    { icon: 'payments', label: t('billing'), href: '/dashboard/invoices', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS, Role.RESIDENT] },
                    { icon: 'badge', label: t('access'), href: '/dashboard/access-control', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS, Role.GUARD, Role.RESIDENT] },
                ],
            },
            {
                label: t('communications'),
                items: [
                    { icon: 'campaign', label: t('announcements'), href: '/dashboard/announcements', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS, Role.RESIDENT, Role.GUARD] },
                    { icon: 'event', label: t('events'), href: '/dashboard/events', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS, Role.RESIDENT, Role.GUARD] },
                    { icon: 'forum', label: t('communications'), href: '/dashboard/communications', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS, Role.RESIDENT, Role.GUARD] },
                    { icon: 'warning', label: t('incidents'), href: '/dashboard/incidents', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS, Role.RESIDENT, Role.GUARD] },
                ],
            },
            {
                label: t('support'),
                items: [
                    { icon: 'groups', label: t('staff'), href: '/dashboard/staff', roles: [Role.SUPER_ADMIN, Role.ADMIN] },
                    { icon: 'description', label: t('documents'), href: '/dashboard/documents', roles: [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS, Role.RESIDENT, Role.GUARD] },
                ],
            },
        ];

    return (
        <aside className="hidden md:flex flex-col w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 fixed left-0 top-0 z-40">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm shadow-primary/30">
                    <span className="material-symbols-outlined text-[20px]">apartment</span>
                </div>
                <div className="flex flex-col">
                    <h1 className="text-slate-900 dark:text-white text-base font-bold leading-none tracking-tight">
                        {user?.role === Role.ADMIN && complexName ? complexName : "CondoManager"}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-1">
                        {user?.role === Role.RESIDENT ? "Resident Portal" : "Admin Console"}
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                {navSections.map((section) => {
                    const filteredItems = section.items.filter(item =>
                        !item.roles || (user?.role && item.roles.includes(user.role as Role))
                    );

                    if (filteredItems.length === 0) return null;

                    return (
                        <div key={section.label}>
                            <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6 first:mt-2">
                                {section.label}
                            </p>
                            {filteredItems.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative overflow-hidden",
                                            isActive
                                                ? "bg-primary/10 text-primary font-medium"
                                                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                    >
                                        <span className={cn(
                                            "material-symbols-outlined text-[20px] transition-transform duration-200 shrink-0",
                                            !isActive && "group-hover:scale-110"
                                        )}>
                                            {item.icon}
                                        </span>
                                        <div className="flex justify-between items-center w-full min-w-0">
                                            <span className="text-sm truncate">{item.label}</span>

                                            {item.badge && (
                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600 animate-in zoom-in ml-2">

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
                    );
                })}
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/profile" className="flex items-center gap-3 group flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold ring-2 ring-transparent group-hover:ring-primary/20 transition-all overflow-hidden shrink-0">
                            {user?.image ? (
                                <img src={user.image} alt={user.name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                                {user?.name || 'User'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user?.role || 'Resident'}</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-1">
                        <Link
                            href="/dashboard/profile"
                            className="p-1.5 text-slate-400 hover:text-primary rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={t('settings')}
                        >
                            <span className="material-symbols-outlined text-[20px]">settings</span>
                        </Link>
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title={t('logout')}
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

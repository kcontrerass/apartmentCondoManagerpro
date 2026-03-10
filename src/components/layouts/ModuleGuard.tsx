"use client";

import { usePathname } from '@/i18n/routing';
import { ReactNode } from 'react';
import { Role } from '@/types/roles';
import { Card } from '@/components/ui/Card';

interface ModuleGuardProps {
    children: ReactNode;
    complexSettings: any;
    userRole?: string;
}

export function ModuleGuard({ children, complexSettings, userRole }: ModuleGuardProps) {
    const pathname = usePathname();

    if (!userRole) return <>{children}</>;
    // Super Admins have bypass
    if (userRole === Role.SUPER_ADMIN) {
        return <>{children}</>;
    }

    const permissions = complexSettings?.permissions?.[userRole];
    // If no explicit configuration is set, we fallback to true (allow)
    if (!permissions) return <>{children}</>;

    const routeKeyMap: Record<string, string> = {
        '/dashboard/units': 'units',
        '/dashboard/residents': 'residents',
        '/dashboard/amenities': 'amenities',
        '/dashboard/reservations': 'reservations',
        '/dashboard/services': 'services',
        '/dashboard/invoices': 'invoices',
        '/dashboard/access-control': 'accessControl',
        '/dashboard/announcements': 'announcements',
        '/dashboard/events': 'events',
        '/dashboard/communications': 'communications',
        '/dashboard/incidents': 'incidents',
        '/dashboard/staff': 'staff',
        '/dashboard/documents': 'documents',
        '/dashboard/polls': 'polls',
        '/dashboard/reports': 'reports'
    };

    // Find if the current pathname matches a protected route
    const matchedRoute = Object.keys(routeKeyMap).find(route =>
        pathname === route || pathname.startsWith(`${route}/`)
    );

    if (matchedRoute) {
        const key = routeKeyMap[matchedRoute];

        // Cascade restriction: if amenities is off, reservations must also be off unconditionally
        const isBlocked = permissions[key] === false || (key === 'reservations' && permissions['amenities'] === false);

        // Only block if explicitly set to false or restricted by cascade
        if (isBlocked) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-in fade-in zoom-in duration-300">
                    <Card className="p-8 max-w-md bg-white dark:bg-background-dark border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="material-symbols-outlined text-3xl">lock</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                            Módulo Deshabilitado
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                            No tienes permisos para acceder a esta sección. El administrador del complejo ha inhabilitado este módulo funcional para tu rol.
                        </p>
                        <button
                            onClick={() => window.history.back()}
                            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            &larr; Volver atrás
                        </button>
                    </Card>
                </div>
            );
        }
    }

    return <>{children}</>;
}

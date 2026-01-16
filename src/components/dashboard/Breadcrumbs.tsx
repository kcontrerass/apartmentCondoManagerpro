"use client";

import { Link, usePathname } from '@/i18n/routing';
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
    dashboard: "Dashboard",
    complexes: "Complejos",
    units: "Unidades",
    residents: "Residentes",
    amenities: "Amenidades",
    services: "Servicios",
    billing: "Facturación",
    access: "Control de Acceso",
    communications: "Comunicaciones",
    incidents: "Incidentes",
    reports: "Reportes",
    documents: "Documentos",
    new: "Nuevo",
    edit: "Editar",
    profile: "Perfil",
};

export function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    return (
        <nav className="flex items-center gap-1 text-sm text-slate-500 whitespace-nowrap overflow-x-auto no-scrollbar">
            {segments.map((segment, index) => {
                const href = `/${segments.slice(0, index + 1).join("/")}`;
                const isLast = index === segments.length - 1;
                const label = routeLabels[segment] || segment;

                // UUID check (simple version)
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
                const displayLabel = isUUID ? "Detalle" : label;

                return (
                    <div key={href} className="flex items-center gap-1">
                        {index > 0 && (
                            <span className="material-symbols-outlined text-[16px] text-slate-300">
                                chevron_right
                            </span>
                        )}
                        {isLast ? (
                            <span className="font-semibold text-slate-900 dark:text-white px-1">
                                {displayLabel}
                            </span>
                        ) : (
                            <Link
                                href={href}
                                className="hover:text-primary transition-colors px-1"
                            >
                                {displayLabel}
                            </Link>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}

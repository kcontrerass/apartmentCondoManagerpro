/**
 * Rutas reales existentes bajo `src/app/[locale]/dashboard/`.
 * Usar en payloads de push; `normalizePayload` en `notifications.ts` añade el prefijo de idioma.
 */
export const pushDashboardUrl = {
    home: "/dashboard",
    reservations: "/dashboard/reservations",
    accessControl: "/dashboard/access-control",
    invoices: "/dashboard/invoices",
    residents: "/dashboard/residents",
    polls: "/dashboard/polls",
    amenities: "/dashboard/amenities",
    services: "/dashboard/services",
    documents: "/dashboard/documents",
    profile: "/dashboard/profile",
    eventsList: "/dashboard/events",
    login: "/login",
    /** Pagos de suscripción a la plataforma (vista súper admin). */
    platformPayments: "/dashboard/platform-payments",
    incident: (id: string) => `/dashboard/incidents/${id}`,
    event: (id: string) => `/dashboard/events/${id}`,
    announcement: (id: string) => `/dashboard/announcements/${id}`,
} as const;

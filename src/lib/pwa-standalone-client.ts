"use client";

/** sessionStorage: cerrar sesión desde PWA para mostrar aviso de notificaciones en login. */
export const PWA_LOGOUT_NOTIFY_SESSION_KEY = "adesso_pwa_notify_after_logout";

export function isStandaloneDisplayMode(): boolean {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

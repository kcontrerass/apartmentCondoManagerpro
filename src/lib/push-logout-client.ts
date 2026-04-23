"use client";

import { signOut } from "next-auth/react";

/**
 * Antes de cerrar sesión: borra la suscripción push del usuario en el servidor y la revoca en el navegador.
 * Incluye todos los `ServiceWorkerRegistration` (útil en PWA / iOS standalone donde a veces hay más de uno).
 */
export async function detachPushBeforeSignOut(): Promise<void> {
    try {
        await fetch("/api/notifications/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
        });
    } catch {
        /* ignorar: sesión puede estar caducada */
    }
    try {
        if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            try {
                const sub = await registration.pushManager.getSubscription();
                if (sub) {
                    await sub.unsubscribe();
                }
            } catch {
                /* siguiente registro */
            }
        }
    } catch {
        /* ignorar */
    }
}

/** Cierre de sesión seguro para web y PWA: desvincula push y luego `signOut` de NextAuth. */
export async function signOutAndDetachPush(
    options?: Parameters<typeof signOut>[0]
): Promise<void> {
    await detachPushBeforeSignOut();
    await signOut(options);
}

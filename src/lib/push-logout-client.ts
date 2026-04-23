"use client";

import { signOut } from "next-auth/react";

/**
 * Al cerrar sesión: quita la suscripción guardada **solo para este usuario** en el servidor.
 * El navegador sigue suscrito al push para no tener que reactivar notificaciones al volver a entrar;
 * al iniciar sesión otro perfil, `PushSubscriptionSessionSync` reasigna el mismo endpoint a esa cuenta.
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
}

/** Cierra sesión tras limpiar la suscripción push del usuario actual en BD (sin desactivar push en el dispositivo). */
export async function signOutAndDetachPush(
    options?: Parameters<typeof signOut>[0]
): Promise<void> {
    await detachPushBeforeSignOut();
    await signOut(options);
}

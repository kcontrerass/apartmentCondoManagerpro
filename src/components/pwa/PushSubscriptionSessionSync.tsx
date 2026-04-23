"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

/**
 * Si el navegador ya tiene suscripción push (permiso concedido), la asocia al usuario de la sesión actual.
 * Así, al cambiar de cuenta sin revocar push en el dispositivo, el endpoint queda solo en el usuario
 * que inició sesión y no recibe avisos del perfil anterior.
 */
export function PushSubscriptionSessionSync() {
    const { data: session, status } = useSession();
    const lastBoundUserId = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (status === "loading") return;

        const userId = session?.user?.id;
        if (!userId) {
            lastBoundUserId.current = undefined;
            return;
        }

        if (lastBoundUserId.current === userId) {
            return;
        }

        void (async () => {
            if (typeof window === "undefined" || !window.isSecureContext) return;
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
            if (Notification.permission !== "granted") return;

            try {
                await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
                const registration = await navigator.serviceWorker.ready;
                const sub = await registration.pushManager.getSubscription();
                if (!sub) return;

                const res = await fetch("/api/notifications/subscribe", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify(sub.toJSON()),
                });
                if (res.ok) {
                    lastBoundUserId.current = userId;
                }
            } catch {
                /* reintentar en otra navegación o al activar desde perfil */
            }
        })();
    }, [session?.user?.id, status]);

    return null;
}

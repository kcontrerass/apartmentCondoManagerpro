"use client";

import { assertValidVapidApplicationServerKey, urlBase64ToUint8Array } from "@/lib/vapid-client";

async function postSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    const payload = subscription.toJSON();
    const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const data = await response.json().catch(() => null);
        const msg =
            data && typeof data === "object" && "error" in data
                ? String((data as { error?: { message?: string } }).error?.message ?? "")
                : "";
        throw new Error(msg || "Failed to save subscription on server");
    }
}

/**
 * Pide permiso y registra la suscripción push + servidor.
 * @returns permiso final (`granted` solo si también se suscribió bien)
 */
export async function subscribeToPushNotifications(): Promise<NotificationPermission> {
    const result = await Notification.requestPermission();
    if (result !== "granted") {
        return result;
    }

    const vapidRaw = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidRaw?.trim()) {
        throw new Error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
    }

    await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
    const registration = await navigator.serviceWorker.ready;

    const keyBytes = urlBase64ToUint8Array(vapidRaw);
    assertValidVapidApplicationServerKey(keyBytes);
    const applicationServerKey = new Uint8Array(keyBytes);

    const subscribeOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true,
        applicationServerKey,
    };

    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        await postSubscriptionToServer(subscription);
    } else {
        try {
            subscription = await registration.pushManager.subscribe(subscribeOptions);
        } catch (firstError) {
            console.warn("[push] subscribe retry after unsubscribe", firstError);
            const stale = await registration.pushManager.getSubscription();
            if (stale) {
                await stale.unsubscribe();
            }
            subscription = await registration.pushManager.subscribe(subscribeOptions);
        }
        await postSubscriptionToServer(subscription);
    }

    return "granted";
}

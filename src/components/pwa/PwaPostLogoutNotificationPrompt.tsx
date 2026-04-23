"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
    isStandaloneDisplayMode,
    PWA_LOGOUT_NOTIFY_SESSION_KEY,
} from "@/lib/pwa-standalone-client";
import { subscribeToPushNotifications } from "@/lib/web-push-subscribe";

/**
 * Tras cerrar sesión en la PWA, al volver a entrar muestra un aviso con botón para reactivar notificaciones push.
 */
export function PwaPostLogoutNotificationPrompt() {
    const t = useTranslations("PWAInstall");
    const tNotif = useTranslations("Profile.notifications");
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const dismiss = useCallback(() => {
        try {
            sessionStorage.removeItem(PWA_LOGOUT_NOTIFY_SESSION_KEY);
        } catch {
            /* */
        }
        setVisible(false);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!isStandaloneDisplayMode() || !window.isSecureContext) return;
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

        try {
            if (sessionStorage.getItem(PWA_LOGOUT_NOTIFY_SESSION_KEY) !== "1") return;
        } catch {
            return;
        }

        // Siempre mostrar tras login en PWA si hubo cierre de sesión antes, aunque el perfil ya tenga notificaciones activas.
        setVisible(true);
    }, []);

    const onEnable = async () => {
        setLoading(true);
        try {
            const perm = await subscribeToPushNotifications();
            if (perm === "granted") {
                dismiss();
                toast.success(tNotif("subscribedSuccess"));
                return;
            }
        } catch (error: unknown) {
            console.error("[PwaPostLogoutNotificationPrompt]", error);
            let message = tNotif("subscribeError");
            if (error instanceof Error) {
                if (error.message === "Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY") {
                    message = tNotif("subscribeErrorMissingKey");
                } else if (
                    error.message === "VAPID_PUBLIC_KEY_EMPTY" ||
                    error.message === "VAPID_PUBLIC_KEY_BASE64_INVALID" ||
                    error.message === "VAPID_PUBLIC_KEY_WRONG_LENGTH"
                ) {
                    message = tNotif("subscribeErrorVapid");
                }
            }
            if (error instanceof DOMException) {
                const m = error.message || "";
                if (error.name === "SecurityError") {
                    message = tNotif("subscribeErrorVapid");
                } else if (
                    error.name === "AbortError" ||
                    m.includes("push service") ||
                    m.includes("Push service")
                ) {
                    message = tNotif("subscribeErrorPushService");
                }
            }
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[100] border-t border-primary/25 bg-primary/10 dark:bg-primary/15 backdrop-blur-md px-4 py-4 md:py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
            role="region"
            aria-label={t("postLogoutNotifyTitle")}
        >
            <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex gap-3 min-w-0">
                    <span
                        className="material-symbols-outlined text-primary shrink-0 text-2xl"
                        aria-hidden
                    >
                        notifications_active
                    </span>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {t("postLogoutNotifyTitle")}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                            {t("postLogoutNotifyBody")}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0 sm:ml-4 w-full sm:w-auto">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={dismiss}
                        disabled={loading}
                    >
                        {t("postLogoutNotifyLater")}
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => void onEnable()}
                        isLoading={loading}
                    >
                        {t("postLogoutNotifyEnable")}
                    </Button>
                </div>
            </div>
        </div>
    );
}

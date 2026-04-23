"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import { assertValidVapidApplicationServerKey, urlBase64ToUint8Array } from '@/lib/vapid-client';

export function NotificationManager() {
    const t = useTranslations("Profile.notifications");
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);

    const [isiOS, setIsiOS] = useState(false);
    const [isSecure, setIsSecure] = useState(true);
    const [isStandalone, setIsStandalone] = useState(false);

    const checkSubscription = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch {
            setIsSubscribed(false);
        }
    }, []);

    useEffect(() => {
        const ua = window.navigator.userAgent;
        setIsiOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);
        setIsSecure(window.isSecureContext);

        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(isStandaloneMode);

        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
            void checkSubscription();
        }
    }, [checkSubscription]);

    const subscribeUser = async () => {
        setLoading(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                const vapidRaw = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidRaw?.trim()) {
                    throw new Error('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY');
                }

                await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
                const registration = await navigator.serviceWorker.ready;

                const keyBytes = urlBase64ToUint8Array(vapidRaw);
                assertValidVapidApplicationServerKey(keyBytes);
                const applicationServerKey = new Uint8Array(keyBytes);

                const subscribeOptions: PushSubscriptionOptionsInit = {
                    userVisibleOnly: true,
                    applicationServerKey,
                };

                const subscription = await registration.pushManager.subscribe(subscribeOptions);

                // Save subscription to server
                const response = await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                });

                if (!response.ok) throw new Error('Failed to save subscription on server');

                setIsSubscribed(true);
                toast.success(t('subscribedSuccess'));
            }
        } catch (error: unknown) {
            console.error('Error subscribing to push:', error);
            let message = t('subscribeError');
            if (error instanceof Error) {
                if (error.message === 'Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY') {
                    message = t('subscribeErrorMissingKey');
                } else if (
                    error.message === 'VAPID_PUBLIC_KEY_EMPTY' ||
                    error.message === 'VAPID_PUBLIC_KEY_BASE64_INVALID' ||
                    error.message === 'VAPID_PUBLIC_KEY_WRONG_LENGTH'
                ) {
                    message = t('subscribeErrorVapid');
                }
            }
            if (error instanceof DOMException) {
                const m = error.message || '';
                if (error.name === 'SecurityError') {
                    message = t('subscribeErrorVapid');
                } else if (
                    error.name === 'AbortError' ||
                    m.includes('push service') ||
                    m.includes('Push service')
                ) {
                    message = t('subscribeErrorPushService');
                }
            }
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeUser = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
            }

            // Remove from server
            await fetch('/api/notifications/unsubscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            setIsSubscribed(false);
            toast.success(t('unsubscribedSuccess'));
        } catch (error) {
            console.error('Error unsubscribing:', error);
            toast.error(t('unsubscribeError'));
        } finally {
            setLoading(false);
        }
    };

    const sendTestNotification = async () => {
        setTestLoading(true);
        try {
            const response = await fetch('/api/notifications/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to send test notification');
            }

            toast.success(t('testSent'));
        } catch (error) {
            console.error('Error sending test push:', error);
            toast.error(t('testError'));
        } finally {
            setTestLoading(false);
        }
    };

    if (!isSupported || !isSecure) {
        return (
            <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 mt-4 border-dashed">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-sm">warning</span>
                    {t('unavailableTitle')}
                </h3>
                <div className="text-xs text-slate-500 space-y-2">
                    {!isSecure && (
                        <p className="text-red-500 font-medium">
                            {t('httpsRequired')}
                        </p>
                    )}
                    <p>
                        {isiOS
                            ? t('iosSupportHint')
                            : t('browserUnsupported')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border rounded-lg bg-card mt-4">
            <h3 className="text-lg font-semibold mb-2">{t('title')}</h3>
            <p className="text-sm text-slate-500 mb-4">
                {t('description')}
            </p>
            {isiOS && !isStandalone && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mb-3 rounded-md bg-amber-50 dark:bg-amber-950/40 p-2">
                    {t('iosInstallHint.prefix')} <strong>{t('iosInstallHint.strong')}</strong> {t('iosInstallHint.suffix')}
                </p>
            )}

            {isSubscribed ? (
                <div className="space-y-4">
                    <div className="text-sm text-green-600 flex items-center gap-2">
                        <span className="material-symbols-outlined font-icon">check_circle</span>
                        {t('enabled')}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">

                        <Button
                            variant="ghost"
                            onClick={unsubscribeUser}
                            disabled={loading}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                            {t('disable')}
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    onClick={subscribeUser}
                    disabled={loading || permission === 'denied'}
                    className="w-full sm:w-auto"
                >
                    {loading ? t('processing') : t('enable')}
                </Button>
            )}

            {permission === 'denied' && (
                <p className="text-xs text-red-500 mt-2">
                    {t('blocked')}
                </p>
            )}
        </div>
    );
}

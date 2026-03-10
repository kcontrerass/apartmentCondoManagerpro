"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

export function NotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);

    const [isiOS, setIsiOS] = useState(false);
    const [isSecure, setIsSecure] = useState(true);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        const ua = window.navigator.userAgent;
        setIsiOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);
        setIsSecure(window.isSecureContext);

        const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(isStandaloneMode);

        if ('serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, []);

    const checkSubscription = async () => {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
    };

    const subscribeUser = async () => {
        setLoading(true);
        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                console.log('🔔 Notifications permission granted');
                if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
                    throw new Error('Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY');
                }

                // Ensure SW is registered and ready
                await navigator.serviceWorker.register('/sw.js');
                const registration = await navigator.serviceWorker.ready;

                console.log('🛠 Service Worker ready:', registration.active?.state);

                const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
                console.log('📦 Uint8Array Key Length:', applicationServerKey.length);

                const subscribeOptions = {
                    userVisibleOnly: true,
                    applicationServerKey: applicationServerKey
                };

                console.log('📡 Subscribing with key:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
                const subscription = await registration.pushManager.subscribe(subscribeOptions);
                console.log('✅ Subscription successful:', subscription.endpoint);

                // Save subscription to server
                const response = await fetch('/api/notifications/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(subscription)
                });

                if (!response.ok) throw new Error('Failed to save subscription on server');

                setIsSubscribed(true);
                toast.success('¡Suscrito a notificaciones!');
            }
        } catch (error) {
            console.error('Error subscribing to push:', error);
            toast.error('Error al suscribirse a las notificaciones');
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
            toast.success('Notificaciones desactivadas');
        } catch (error) {
            console.error('Error unsubscribing:', error);
            toast.error('Error al desactivar las notificaciones');
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

            toast.success('Notificación de prueba enviada');
        } catch (error) {
            console.error('Error sending test push:', error);
            toast.error('Error al enviar la notificación de prueba');
        } finally {
            setTestLoading(false);
        }
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        console.log('🧪 Decoding key:', base64String);
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        console.log('✅ Decoded Uint8Array length:', outputArray.length);
        return outputArray;
    };

    if (!isStandalone) return null;

    if (!isSupported) {
        return (
            <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800/50 mt-4 border-dashed">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500 text-sm">warning</span>
                    Notificaciones No Soportadas
                </h3>
                <div className="text-xs text-slate-500 space-y-2">
                    {!isSecure && (
                        <p className="text-red-500 font-medium">
                            ⚠️ Estás accediendo por una conexión no segura (HTTP). Las notificaciones requieren HTTPS o localhost.
                        </p>
                    )}
                    <p>
                        {isiOS
                            ? 'En iOS, para activar las notificaciones debes "Añadir a la pantalla de inicio" esta aplicación (PWA) y abrirla desde el icono generado.'
                            : 'Tu navegador no soporta notificaciones Push o estás en modo incógnito/HTTP.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border rounded-lg bg-card mt-4">
            <h3 className="text-lg font-semibold mb-2">Notificaciones Push</h3>
            <p className="text-sm text-slate-500 mb-4">
                Activa las notificaciones para recibir avisos e incidentes importantes directamente en tu dispositivo.
            </p>

            {isSubscribed ? (
                <div className="space-y-4">
                    <div className="text-sm text-green-600 flex items-center gap-2">
                        <span className="material-symbols-outlined font-icon">check_circle</span>
                        Notificaciones activadas
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">

                        <Button
                            variant="ghost"
                            onClick={unsubscribeUser}
                            disabled={loading}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                            Desactivar
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    onClick={subscribeUser}
                    disabled={loading || permission === 'denied'}
                    className="w-full sm:w-auto"
                >
                    {loading ? 'Procesando...' : 'Activar Notificaciones'}
                </Button>
            )}

            {permission === 'denied' && (
                <p className="text-xs text-red-500 mt-2">
                    Las notificaciones han sido bloqueadas. Por favor, habilítalas en la configuración de sitios de tu navegador.
                </p>
            )}
        </div>
    );
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { stripPushSubscriptionFromOtherUsers } from '@/lib/notifications';

function normalizePushSubscription(raw: unknown): Record<string, unknown> | null {
    if (!raw || typeof raw !== 'object') return null;
    const o = raw as Record<string, unknown>;
    const endpoint = o.endpoint;
    if (typeof endpoint !== 'string' || !endpoint.trim()) return null;
    const keys = o.keys;
    if (!keys || typeof keys !== 'object') return null;
    const k = keys as Record<string, unknown>;
    if (typeof k.p256dh !== 'string' || typeof k.auth !== 'string') return null;
    return {
        endpoint: endpoint.trim(),
        expirationTime: o.expirationTime ?? null,
        keys: { p256dh: k.p256dh, auth: k.auth },
    };
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
                { status: 401 }
            );
        }

        const body = await request.json();
        const subscription = normalizePushSubscription(body);
        if (!subscription) {
            return NextResponse.json(
                {
                    success: false,
                    error: { code: 'INVALID_SUBSCRIPTION', message: 'Formato de suscripción push inválido' },
                },
                { status: 400 }
            );
        }

        // Fetch current settings to preserve them
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { settings: true }
        });

        const currentSettings = (user?.settings as any) || {};

        await stripPushSubscriptionFromOtherUsers(subscription.endpoint as string, session.user.id);

        await (prisma as any).user.update({
            where: { id: session.user.id },
            data: {
                settings: {
                    ...currentSettings,
                    pushSubscription: subscription
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[NOTIFICATIONS_SUBSCRIBE_POST]', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}

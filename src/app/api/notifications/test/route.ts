import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import webpush from 'web-push';

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { settings: true }
        });

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        const settings = (user.settings as any) || {};
        const subscription = settings.pushSubscription;

        if (!subscription) {
            return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
        }

        // Configure web-push
        webpush.setVapidDetails(
            'mailto:admin@condomanager.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
            process.env.VAPID_PRIVATE_KEY!
        );

        const payload = JSON.stringify({
            title: '¡Prueba Exitosa!',
            body: 'Tus notificaciones están configuradas correctamente.',
            url: '/dashboard/profile'
        });

        await webpush.sendNotification(subscription, payload);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error sending test notification:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

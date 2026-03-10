import webpush from 'web-push';
import { prisma } from './db';

// Configure web-push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:admin@condomanager.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

interface NotificationPayload {
    title: string;
    body: string;
    url?: string;
    icon?: string;
}

/**
 * Send a push notification to a specific user
 */
export async function sendUserNotification(userId: string, payload: NotificationPayload) {
    try {
        const user = await (prisma as any).user.findUnique({
            where: { id: userId },
            select: { settings: true }
        });

        if (!user?.settings) return;

        const settings = user.settings as any;
        const subscription = settings.pushSubscription;

        if (!subscription) return;

        await webpush.sendNotification(subscription, JSON.stringify(payload));
        console.log(`Push notification sent to user ${userId}`);
    } catch (error) {
        console.error(`Error sending push to user ${userId}:`, error);
    }
}

/**
 * Send a push notification to all users in a complex with specific roles
 */
export async function sendComplexNotification(complexId: string, roles: string[], payload: NotificationPayload) {
    try {
        const users = await (prisma as any).user.findMany({
            where: {
                OR: [
                    { complexId: complexId },
                    { managedComplexes: { id: complexId } }
                ],
                role: { in: roles as any },
                settings: { not: null }
            },
            select: { id: true, settings: true }
        });

        const sendPromises = users.map((user: any) => {
            const settings = user.settings as any;
            const subscription = settings?.pushSubscription;
            if (subscription) {
                return webpush.sendNotification(subscription, JSON.stringify(payload))
                    .catch(err => console.error(`Error sending notification to ${user.id}:`, err));
            }
            return Promise.resolve();
        });

        await Promise.all(sendPromises);
        console.log(`Broadcast notification sent to ${users.length} users in complex ${complexId}`);
    } catch (error) {
        console.error(`Error in broadcast notification for complex ${complexId}:`, error);
    }
}

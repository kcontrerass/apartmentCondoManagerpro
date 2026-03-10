import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Get current user settings
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { settings: true }
        });

        if (!user) {
            return new NextResponse('User not found', { status: 404 });
        }

        const settings = (user.settings as any) || {};

        // Remove pushSubscription from settings
        const newSettings = { ...settings };
        delete newSettings.pushSubscription;

        await prisma.user.update({
            where: { id: session.user.id },
            data: { settings: newSettings }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unsubscribing:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

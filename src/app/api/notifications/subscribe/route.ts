import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
                { status: 401 }
            );
        }

        const subscription = await request.json();

        // Update user with subscription info
        // We'll store it as a JSON string in a new field if possible, 
        // or repurpose an existing settings field.
        await (prisma as any).user.update({
            where: { id: session.user.id },
            data: {
                settings: {
                    ...(session.user as any).settings,
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

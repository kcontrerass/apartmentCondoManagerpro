import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { Role } from '@/types/roles';
import { sendUserNotification } from '@/lib/notifications';
import { pushDashboardUrl } from '@/lib/push-dashboard-paths';

/**
 * POST /api/polls/[id]/vote
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

        const { id: pollId } = await params;
        const body = await request.json();
        const { optionId } = body;

        if (!optionId) {
            return NextResponse.json({ success: false, error: { message: 'ID de opción es requerido' } }, { status: 400 });
        }

        // Verify poll status and user access
        const pollResult: any[] = await prisma.$queryRawUnsafe(
            `SELECT status, expires_at as expiresAt, complex_id as complexId FROM polls WHERE id = ?`,
            pollId
        );

        if (pollResult.length === 0) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
        const poll = pollResult[0];

        if (poll.status === 'CLOSED' || (poll.expiresAt && new Date() > new Date(poll.expiresAt))) {
            return NextResponse.json({ success: false, error: { message: 'La votación ha finalizado o está cerrada' } }, { status: 400 });
        }

        // Access check: only residents or members of the complex
        // Usually, only RESIDENTs vote, but we can allow others if they belong to the complex
        const userRole = session.user.role;
        const userId = session.user.id!;
        const userComplexId = (session.user as any).complexId;

        if (userRole !== Role.SUPER_ADMIN && userComplexId !== poll.complexId) {
            return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'No puedes votar en este complejo' } }, { status: 403 });
        }

        // Check for duplicate vote
        const existingVote: any[] = await prisma.$queryRawUnsafe(
            `SELECT id FROM votes WHERE poll_id = ? AND user_id = ?`,
            pollId, userId
        );

        if (existingVote.length > 0) {
            return NextResponse.json({ success: false, error: { message: 'Ya has emitido tu voto en esta encuesta' } }, { status: 400 });
        }

        // Register the vote
        const voteId = `vot${Math.random().toString(36).substring(2, 11)}`;
        await prisma.$executeRawUnsafe(
            `INSERT INTO votes (id, poll_id, option_id, user_id, created_at)
             VALUES (?, ?, ?, ?, NOW())`,
            voteId, pollId, optionId, userId
        );

        const pollMeta = await prisma.poll.findUnique({
            where: { id: pollId },
            select: { authorId: true, title: true },
        });
        if (pollMeta && pollMeta.authorId !== userId) {
            await sendUserNotification(pollMeta.authorId, {
                title: 'Nuevo voto en encuesta',
                body: `Alguien votó en: ${pollMeta.title}`,
                url: pushDashboardUrl.polls,
            });
        }

        return NextResponse.json({ success: true, data: { id: voteId } });
    } catch (error: any) {
        console.error('[POLL_VOTE_POST]', error);
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    }
}

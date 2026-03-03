import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { Role } from '@/types/roles';

/**
 * GET /api/polls/[id]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

        const { id } = await params;

        const pollResult: any[] = await prisma.$queryRawUnsafe(
            `SELECT p.*, u.name as authorName 
             FROM polls p 
             JOIN users u ON p.author_id = u.id 
             WHERE p.id = ?`,
            id
        );

        if (pollResult.length === 0) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
        const poll = pollResult[0];

        // Access check
        const userRole = session.user.role;
        const userComplexId = (session.user as any).complexId;
        if (userRole !== Role.SUPER_ADMIN && userComplexId !== poll.complex_id) {
            return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
        }

        const options: any[] = await prisma.$queryRawUnsafe(
            `SELECT o.*, 
                    (SELECT COUNT(*) FROM votes v WHERE v.option_id = o.id) as voteCount 
             FROM poll_options o 
             WHERE o.poll_id = ?`,
            id
        );

        const userVoteResult: any[] = await prisma.$queryRawUnsafe(
            `SELECT option_id FROM votes WHERE poll_id = ? AND user_id = ?`,
            id, session.user.id!
        );
        const hasVoted = userVoteResult.length > 0;

        return NextResponse.json({
            success: true,
            data: {
                id: poll.id,
                title: poll.title,
                description: poll.description,
                status: poll.status,
                expiresAt: poll.expires_at,
                complexId: poll.complex_id,
                createdAt: poll.created_at,
                author: { id: poll.author_id, name: poll.authorName },
                options: options.map(o => ({
                    id: o.id,
                    text: o.text,
                    _count: { votes: Number(o.voteCount) }
                })),
                _count: { votes: options.reduce((sum, o) => sum + Number(o.voteCount), 0) },
                hasVoted,
                userOptionId: hasVoted ? userVoteResult[0].option_id : null
            }
        });
    } catch (error: any) {
        console.error('[POLL_GET]', error);
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    }
}

/**
 * PATCH /api/polls/[id]
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        const pollResult: any[] = await prisma.$queryRawUnsafe(
            `SELECT author_id as authorId, complex_id as complexId FROM polls WHERE id = ?`,
            id
        );
        if (pollResult.length === 0) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
        const poll = pollResult[0];

        // RBAC check: only SuperAdmin or Admin/Board of the complex
        const userRole = session.user.role;
        const userComplexId = (session.user as any).complexId;
        const isManager = [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS].includes(userRole as Role);

        if (!isManager || (userRole !== Role.SUPER_ADMIN && userComplexId !== poll.complexId)) {
            return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
        }

        await prisma.$executeRawUnsafe(
            `UPDATE polls SET status = ?, updated_at = NOW() WHERE id = ?`,
            status, id
        );

        return NextResponse.json({ success: true, data: { id, status } });
    } catch (error: any) {
        console.error('[POLL_PATCH]', error);
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    }
}

/**
 * DELETE /api/polls/[id]
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

        const { id } = await params;

        const pollResult: any[] = await prisma.$queryRawUnsafe(
            `SELECT complex_id as complexId FROM polls WHERE id = ?`,
            id
        );
        if (pollResult.length === 0) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });
        const poll = pollResult[0];

        // RBAC check: same as PATCH
        const userRole = session.user.role;
        const userComplexId = (session.user as any).complexId;
        const isManager = [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS].includes(userRole as Role);

        if (!isManager || (userRole !== Role.SUPER_ADMIN && userComplexId !== poll.complexId)) {
            return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
        }

        await prisma.$executeRawUnsafe(`DELETE FROM votes WHERE poll_id = ?`, id);
        await prisma.$executeRawUnsafe(`DELETE FROM poll_options WHERE poll_id = ?`, id);
        await prisma.$executeRawUnsafe(`DELETE FROM polls WHERE id = ?`, id);

        return NextResponse.json({ success: true, message: 'Votación eliminada' });
    } catch (error: any) {
        console.error('[POLL_DELETE]', error);
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { Role } from '@/types/roles';
import { pollSchema } from '@/lib/validations/poll';
import { sendComplexNotification } from '@/lib/notifications';

/**
 * GET /api/polls
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const complexId = searchParams.get('complexId');

        const polls: any[] = await prisma.$queryRawUnsafe(`
            SELECT p.*, 
                   u.name as authorName,
                   (SELECT COUNT(*) FROM votes v WHERE v.poll_id = p.id) as voteCount
            FROM polls p
            JOIN users u ON p.author_id = u.id
            ${complexId ? 'WHERE p.complex_id = ?' : ''}
            ORDER BY p.created_at DESC
        `, ...(complexId ? [complexId] : []));

        // Transform and fetch options/user status
        const pollsWithUserStatus = await Promise.all(polls.map(async (poll) => {
            const options: any[] = await prisma.$queryRawUnsafe(
                `SELECT o.*, 
                        (SELECT COUNT(*) FROM votes v WHERE v.option_id = o.id) as voteCount
                 FROM poll_options o 
                 WHERE o.poll_id = ?`,
                poll.id
            );

            const userVote: any[] = await prisma.$queryRawUnsafe(
                `SELECT option_id FROM votes WHERE poll_id = ? AND user_id = ?`,
                poll.id, session.user.id!
            );

            return {
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
                _count: { votes: Number(poll.voteCount) },
                hasVoted: userVote.length > 0,
                userOptionId: userVote.length > 0 ? userVote[0].option_id : null
            };
        }));

        return NextResponse.json({ success: true, data: pollsWithUserStatus });
    } catch (error: any) {
        console.error('[POLLS_GET]', error);
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    }
}

/**
 * POST /api/polls
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

        const body = await request.json();
        const validated = pollSchema.safeParse(body);

        if (!validated.success) {
            return NextResponse.json({ success: false, error: validated.error.format() }, { status: 400 });
        }

        const { title, description, complexId, expiresAt, options } = validated.data;

        // RBAC check: only SuperAdmin or Admin/Board of the complex
        const userRole = session.user.role;
        const userComplexId = (session.user as any).complexId;
        const isManager = [Role.SUPER_ADMIN, Role.ADMIN, Role.BOARD_OF_DIRECTORS].includes(userRole as Role);

        if (!isManager || (userRole !== Role.SUPER_ADMIN && userComplexId !== complexId)) {
            return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
        }

        const pollId = `pol${Math.random().toString(36).substring(2, 11)}`;

        await prisma.$executeRawUnsafe(
            `INSERT INTO polls (id, title, description, status, expires_at, complex_id, author_id, created_at, updated_at)
             VALUES (?, ?, ?, 'OPEN', ?, ?, ?, NOW(), NOW())`,
            pollId, title, description || null, expiresAt ? new Date(expiresAt) : null, complexId, session.user.id!
        );

        // Insert options and collect them for response
        const insertedOptions = [];
        for (const optionText of options) {
            const optionId = `opt${Math.random().toString(36).substring(2, 11)}`;
            await prisma.$executeRawUnsafe(
                `INSERT INTO poll_options (id, text, poll_id) VALUES (?, ?, ?)`,
                optionId, optionText, pollId
            );
            insertedOptions.push({
                id: optionId,
                text: optionText,
                _count: { votes: 0 }
            });
        }

        const fullPoll = {
            id: pollId,
            title,
            description: description || null,
            status: 'OPEN',
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            complexId,
            createdAt: new Date(),
            author: { id: session.user.id, name: session.user.name },
            options: insertedOptions,
            _count: { votes: 0 },
            hasVoted: false
        };

        // Notify residents about new poll
        sendComplexNotification(complexId, ['RESIDENT'], {
            title: `Nueva Encuesta: ${title}`,
            body: `Tu opinión es importante. Participa en nuestra nueva encuesta.`,
            url: `/dashboard/polls`
        });

        return NextResponse.json({ success: true, data: fullPoll }, { status: 201 });
    } catch (error: any) {
        console.error('[POLLS_POST]', error);
        return NextResponse.json({ success: false, error: { message: error.message } }, { status: 500 });
    }
}

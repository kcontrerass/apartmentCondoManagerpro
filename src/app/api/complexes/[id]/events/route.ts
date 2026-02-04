import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/complexes/[id]/events
 * List events for a complex
 * 
 * Query params:
 * - timeframe: Filter by timeframe (upcoming, past, all) - default: upcoming
 * - limit: Number of results (default: 50)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
                { status: 401 }
            );
        }

        const { id: complexId } = await params;
        const { searchParams } = new URL(request.url);
        const timeframe = searchParams.get('timeframe') || 'upcoming';
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search');

        console.log(`[API] Fetching events for complex: ${complexId}, timeframe: ${timeframe}, user: ${session.user.id}`);

        // Verify complex exists
        const complex = await prisma.complex.findUnique({
            where: { id: complexId },
        });

        if (!complex) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Complejo no encontrado' } },
                { status: 404 }
            );
        }

        // Build where clause
        const where: any = {
            complexId,
        };

        if (search) {
            where.title = {
                contains: search,
            };
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (timeframe === 'upcoming') {
            where.eventDate = { gte: startOfToday };
        } else if (timeframe === 'past') {
            where.eventDate = { lt: startOfToday };
        }

        // Fetch events
        const events = await prisma.event.findMany({
            where,
            include: {
                _count: {
                    select: { rsvps: { where: { status: 'GOING' } } },
                },
            },
            orderBy: {
                eventDate: timeframe === 'past' ? 'desc' : 'asc',
            },
            take: limit,
        });

        console.log(`[API] Found ${events.length} events for complex: ${complexId}`);

        return NextResponse.json({
            success: true,
            data: {
                events,
                count: events.length,
            },
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al obtener eventos' } },
            { status: 500 }
        );
    }
}

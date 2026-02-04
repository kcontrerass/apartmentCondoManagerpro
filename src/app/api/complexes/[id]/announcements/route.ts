import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/complexes/[id]/announcements
 * List announcements for a specific complex
 * 
 * Query params:
 * - priority: Filter by priority (LOW, NORMAL, HIGH, URGENT)
 * - status: Filter by status (active, expired, all) - default: active
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
        const priority = searchParams.get('priority');
        const status = searchParams.get('status') || 'active';
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search');

        console.log(`[API] Fetching announcements for complex: ${complexId}, status: ${status}, user: ${session.user.id}`);

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

        // Filter by priority
        if (priority) {
            where.priority = priority;
        }

        // Filter by status
        const now = new Date();
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

        if (status === 'active') {
            where.OR = [
                { expiresAt: null },
                { expiresAt: { gte: now } },
            ];
            // Allow slightly "future" publishedAt to account for clock drift
            where.publishedAt = { lte: tenMinutesFromNow };
        } else if (status === 'expired') {
            where.expiresAt = { lt: now };
        }
        // 'all' means no additional filters

        // Fetch announcements
        const announcements = await prisma.announcement.findMany({
            where,
            include: {
                complex: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                publishedAt: 'desc',
            },
            take: limit,
        });

        console.log(`[API] Found ${announcements.length} announcements for complex: ${complexId}`);

        return NextResponse.json({
            success: true,
            data: {
                announcements,
                count: announcements.length,
            },
        });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al obtener avisos' } },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { eventCreateSchema } from '@/lib/validations/event';

/**
 * GET /api/events
 * List events across all complexes (SUPER_ADMIN only)
 * 
 * Query params:
 * - timeframe: Filter by timeframe (upcoming, past, all)
 * - limit: Number of results
 * - search: Search by title
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
                { status: 401 }
            );
        }

        // Only SUPER_ADMIN can access global events
        if (session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para acceder a esta ruta' } },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const timeframe = searchParams.get('timeframe') || 'upcoming';
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search');

        // Build where clause
        const where: any = {};

        if (search) {
            where.title = { contains: search, mode: 'insensitive' };
        }

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (timeframe === 'upcoming') {
            where.eventDate = { gte: startOfToday };
        } else if (timeframe === 'past') {
            where.eventDate = { lt: startOfToday };
        }

        const events = await prisma.event.findMany({
            where,
            include: {
                _count: {
                    select: { rsvps: { where: { status: 'GOING' } } },
                },
                complex: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                eventDate: timeframe === 'past' ? 'desc' : 'asc',
            },
            take: limit,
        });

        return NextResponse.json({
            success: true,
            data: {
                events,
                count: events.length,
            },
        });
    } catch (error: any) {
        console.error('Error fetching global events:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al obtener eventos globales' } },
            { status: 500 }
        );
    }
}

/**
 * POST /api/events
 * Create a new event
 * 
 * Permissions: ADMIN, BOARD_OF_DIRECTORS
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: { code: 'UNAUTHORIZED', message: 'No autenticado' } },
                { status: 401 }
            );
        }

        // Check permissions
        const userRole = session.user.role;
        if (!['SUPER_ADMIN', 'ADMIN', 'BOARD_OF_DIRECTORS'].includes(userRole)) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para crear eventos' } },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate input
        const validation = eventCreateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Errores de validación',
                        details: validation.error.issues,
                    },
                },
                { status: 422 }
            );
        }

        const data = validation.data;

        // Verify complex access
        if (userRole !== 'SUPER_ADMIN' && (session.user as any).complexId !== data.complexId) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'No tienes acceso a este complejo' } },
                { status: 403 }
            );
        }

        // Create event
        const event = await prisma.event.create({
            data: {
                complexId: data.complexId,
                title: data.title,
                description: data.description,
                location: data.location || null,
                eventDate: new Date(data.eventDate),
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                imageUrl: data.imageUrl || null,
                organizerId: session.user.id,
                organizerName: session.user.name || 'Administración',
            },
        });

        return NextResponse.json(
            {
                success: true,
                data: event,
                message: 'Evento creado exitosamente',
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating event:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error.message || 'Error al crear el evento',
                    details: error
                }
            },
            { status: 500 }
        );
    }
}

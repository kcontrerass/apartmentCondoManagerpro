import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { eventUpdateSchema } from '@/lib/validations/event';

/**
 * GET /api/events/[id]
 * Get detailed information about an event including RSVPs
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

        const { id } = await params;

        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                complex: {
                    select: { id: true, name: true },
                },
                rsvps: {
                    include: {
                        // Detailed RSVP info can be added here if needed
                    },
                },
                _count: {
                    select: { rsvps: true },
                },
            },
        });

        if (!event) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Evento no encontrado' } },
                { status: 404 }
            );
        }

        // Check if user has their own RSVP
        const userRsvp = await prisma.eventRSVP.findUnique({
            where: {
                eventId_userId: {
                    eventId: id,
                    userId: session.user.id,
                },
            },
        });

        // Calculate stats
        const rsvpStats = {
            going: await prisma.eventRSVP.count({ where: { eventId: id, status: 'GOING' } }),
            maybe: await prisma.eventRSVP.count({ where: { eventId: id, status: 'MAYBE' } }),
            not_going: await prisma.eventRSVP.count({ where: { eventId: id, status: 'NOT_GOING' } }),
        };

        return NextResponse.json({
            success: true,
            data: {
                ...event,
                currentUserRsvp: userRsvp,
                stats: rsvpStats,
            },
        });
    } catch (error) {
        console.error('Error fetching event detail:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al obtener detalle del evento' } },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/events/[id]
 * Update an existing event
 */
export async function PUT(
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

        const { id } = await params;
        const body = await request.json();

        const currentEvent = await prisma.event.findUnique({
            where: { id },
        });

        if (!currentEvent) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Evento no encontrado' } },
                { status: 404 }
            );
        }

        // Permission check
        const userRole = session.user.role;
        if (userRole !== 'SUPER_ADMIN') {
            const isOrganizer = currentEvent.organizerId === session.user.id;
            const isAdminInSameComplex = userRole === 'ADMIN' && currentEvent.complexId === (session.user as any).complexId;

            if (!isOrganizer && !isAdminInSameComplex) {
                return NextResponse.json(
                    { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permiso para modificar este evento' } },
                    { status: 403 }
                );
            }
        }

        // Validate
        const validation = eventUpdateSchema.safeParse(body);
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

        const updatedEvent = await prisma.event.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                location: data.location,
                eventDate: data.eventDate ? new Date(data.eventDate) : undefined,
                startTime: data.startTime ? new Date(data.startTime) : undefined,
                endTime: data.endTime ? new Date(data.endTime) : undefined,
                imageUrl: data.imageUrl,
                maxAttendees: data.maxAttendees ?? null,
            },
        });

        return NextResponse.json({
            success: true,
            data: updatedEvent,
            message: 'Evento actualizado exitosamente',
        });
    } catch (error) {
        console.error('Error updating event:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al actualizar evento' } },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/events/[id]
 */
export async function DELETE(
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

        const { id } = await params;

        const event = await prisma.event.findUnique({
            where: { id },
        });

        if (!event) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Evento no encontrado' } },
                { status: 404 }
            );
        }

        const userRole = session.user.role;
        if (userRole === 'SUPER_ADMIN' || (userRole === 'ADMIN' && event.complexId === (session.user as any).complexId)) {
            await prisma.event.delete({
                where: { id },
            });

            return NextResponse.json({
                success: true,
                message: 'Evento eliminado exitosamente',
            });
        }

        return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para eliminar este evento' } },
            { status: 403 }
        );
    } catch (error) {
        console.error('Error deleting event:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al eliminar evento' } },
            { status: 500 }
        );
    }
}

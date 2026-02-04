import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { rsvpSchema } from '@/lib/validations/event';

/**
 * POST /api/events/[id]/rsvp
 * Create or update an RSVP for an event
 */
export async function POST(
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

        const { id: eventId } = await params;
        const body = await request.json();

        console.log(`[RSVP API] POST event=${eventId} user=${session?.user?.id} body:`, body);

        // Validate
        const validation = rsvpSchema.safeParse(body);
        if (!validation.success) {
            console.error(`[RSVP API] Validation failed for event=${eventId}:`, validation.error.issues);
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

        const { status, guests } = validation.data;

        // Check if event exists and complex matching
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                _count: {
                    select: { rsvps: { where: { status: 'GOING' } } },
                },
            },
        });

        if (!event) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Evento no encontrado' } },
                { status: 404 }
            );
        }

        // Capacity check if GOING
        if (status === 'GOING' && event.maxAttendees) {
            // Calculate total going if we accept this RSVP
            const attendeesCountResult = await prisma.eventRSVP.aggregate({
                where: {
                    eventId,
                    status: 'GOING',
                    NOT: { userId: session.user.id }, // Exclude current user
                },
                _sum: {
                    guests: true,
                },
                _count: {
                    id: true,
                },
            });

            const otherAttendees = (attendeesCountResult._count.id || 0) + (attendeesCountResult._sum.guests || 0);
            const totalRequested = 1 + guests;

            console.log(`[RSVP API] Capacity check: otherAttendees=${otherAttendees} totalRequested=${totalRequested} max=${event.maxAttendees}`);

            if (otherAttendees + totalRequested > event.maxAttendees) {
                console.warn(`[RSVP API] Capacity reached for event=${eventId}`);
                return NextResponse.json(
                    {
                        success: false,
                        error: {
                            code: 'CAPACITY_REACHED',
                            message: 'Lo sentimos, el evento ha alcanzado su capacidad máxima'
                        }
                    },
                    { status: 400 }
                );
            }
        }

        // Upsert RSVP
        const rsvp = await prisma.eventRSVP.upsert({
            where: {
                eventId_userId: {
                    eventId,
                    userId: session.user.id,
                },
            },
            update: {
                status,
                guests,
            },
            create: {
                eventId,
                userId: session.user.id,
                status,
                guests,
            },
        });

        console.log(`[RSVP API] Saved RSVP for user=${session.user.id} status=${status} guests=${guests}`);

        return NextResponse.json({
            success: true,
            data: rsvp,
            message: 'Tu respuesta ha sido registrada',
        });
    } catch (error) {
        console.error('Error recording RSVP:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al registrar respuesta' } },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/events/[id]/rsvp
 * Cancel an RSVP
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

        const { id: eventId } = await params;

        await prisma.eventRSVP.delete({
            where: {
                eventId_userId: {
                    eventId,
                    userId: session.user.id,
                },
            },
        });

        return NextResponse.json({
            success: true,
            message: 'Asistencia cancelada exitosamente',
        });
    } catch (error) {
        console.error('Error cancelling RSVP:', error);
        // If not found, it's fine
        if ((error as any).code === 'P2025') {
            return NextResponse.json({
                success: true,
                message: 'No tenías una respuesta registrada',
            });
        }
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al cancelar respuesta' } },
            { status: 500 }
        );
    }
}

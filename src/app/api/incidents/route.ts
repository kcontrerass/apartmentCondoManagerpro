import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { incidentSchema } from '@/lib/validations/incident';
import { sendComplexNotification } from '@/lib/notifications';

/**
 * GET /api/incidents
 * List incidents across all complexes (SUPER_ADMIN only)
 * or incidents reported by the current user (RESIDENT)
 * or incidents in the assigned complex (ADMIN/BOARD_OF_DIRECTORS/GUARD)
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

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {};

        // Role-based filtering
        const userRole = session.user.role;
        if (userRole === 'RESIDENT') {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id },
                select: { unitId: true }
            });
            where.OR = [
                { reporterId: session.user.id },
                { unitId: resident?.unitId || 'no-unit' }
            ];
        } else if (userRole === 'ADMIN' || userRole === 'BOARD_OF_DIRECTORS' || userRole === 'GUARD') {
            const complexId = (session.user as any).complexId;
            if (!complexId) {
                return NextResponse.json(
                    { success: false, error: { code: 'FORBIDDEN', message: 'No tienes un complejo asignado' } },
                    { status: 403 }
                );
            }
            where.complexId = complexId;
        } else if (userRole !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos' } },
                { status: 403 }
            );
        }

        // Apply filters
        if (status && status !== 'ALL') where.status = status;
        if (priority && priority !== 'ALL') where.priority = priority;
        if (type && type !== 'ALL') where.type = type;
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const incidents = await prisma.incident.findMany({
            where,
            include: {
                reporter: {
                    select: { id: true, name: true, image: true }
                },
                resolver: {
                    select: { id: true, name: true }
                },
                complex: {
                    select: { id: true, name: true }
                },
                unit: {
                    select: { id: true, number: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: Math.min(limit, 100),
        });

        return NextResponse.json({
            success: true,
            data: incidents,
        });
    } catch (error: any) {
        console.error('[INCIDENTS_GET]', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}

/**
 * POST /api/incidents
 * Create a new incident
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

        const body = await request.json();
        const validation = incidentSchema.safeParse(body);

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

        if (session.user.role === 'SUPER_ADMIN') {
            const complexExists = await prisma.complex.findUnique({
                where: { id: data.complexId },
                select: { id: true },
            });
            if (!complexExists) {
                return NextResponse.json(
                    {
                        success: false,
                        error: { code: 'VALIDATION_ERROR', message: 'El complejo seleccionado no existe' },
                    },
                    { status: 400 }
                );
            }
        }

        // Verify complex access for residents and staff
        if (session.user.role === 'RESIDENT') {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id },
                include: { unit: true }
            });

            if (!resident || !resident.unit || resident.unit.complexId !== data.complexId) {
                return NextResponse.json(
                    { success: false, error: { code: 'FORBIDDEN', message: 'No puedes reportar incidentes para este complejo' } },
                    { status: 403 }
                );
            }
        } else if (session.user.role === 'GUARD' || session.user.role === 'BOARD_OF_DIRECTORS' || session.user.role === 'ADMIN') {
            // Ensure the staff member is assigned to this complex
            const user = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true, managedComplexes: { select: { id: true } } }
            });

            const hasAccess = user?.complexId === data.complexId ||
                user?.managedComplexes?.id === data.complexId;

            if (!hasAccess) {
                return NextResponse.json(
                    { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos en este complejo' } },
                    { status: 403 }
                );
            }
        }

        const incident = await prisma.incident.create({
            data: {
                title: data.title,
                description: data.description,
                status: 'REPORTED',
                priority: data.priority || 'MEDIUM',
                type: data.type || 'OTHER',
                complexId: data.complexId,
                unitId: data.unitId || null,
                reporterId: session.user.id!,
                location: data.location,
                imageUrl: data.imageUrl,
            },
            include: {
                reporter: {
                    select: { id: true, name: true }
                },
                complex: {
                    select: { id: true, name: true }
                }
            }
        });

        // Notify staff (ADMIN, GUARD, BOARD, SUPER_ADMIN) about new incident
        await sendComplexNotification(data.complexId, ['ADMIN', 'GUARD', 'BOARD_OF_DIRECTORS', 'SUPER_ADMIN'], {
            title: `Nuevo Incidente: ${incident.title}`,
            body: `Reportado por ${incident.reporter.name}. Prioridad: ${incident.priority}`,
            url: `/dashboard/incidents/${incident.id}`
        });

        return NextResponse.json(
            {
                success: true,
                data: incident,
                message: 'Incidente reportado exitosamente',
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('[INCIDENTS_POST]', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}

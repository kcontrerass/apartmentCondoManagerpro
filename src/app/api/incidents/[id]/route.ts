import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { updateIncidentSchema } from '@/lib/validations/incident';

/**
 * GET /api/incidents/[id]
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

        const { id } = await params;
        const incident = await prisma.incident.findUnique({
            where: { id },
            include: {
                reporter: { select: { id: true, name: true, image: true, email: true, phone: true } },
                resolver: { select: { id: true, name: true } },
                complex: { select: { id: true, name: true } },
                unit: { select: { id: true, number: true } }
            }
        });

        if (!incident) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });

        // Access check
        const userRole = session.user.role;
        if (userRole === 'RESIDENT' && incident.reporterId !== session.user.id) {
            return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
        }
        if (userRole === 'ADMIN' || userRole === 'BOARD_OF_DIRECTORS' || userRole === 'GUARD') {
            if (incident.complexId !== (session.user as any).complexId) {
                return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
            }
        }

        return NextResponse.json({ success: true, data: incident });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
    }
}

/**
 * PATCH /api/incidents/[id]
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
        const validation = updateIncidentSchema.safeParse(body);

        if (!validation.success) return NextResponse.json({ success: false, error: { details: validation.error.issues } }, { status: 422 });

        const currentIncident = await prisma.incident.findUnique({ where: { id } });
        if (!currentIncident) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });

        // Permission check: only admin/operator or reporter (limited)
        const userRole = session.user.role;
        const isReporter = currentIncident.reporterId === session.user.id;
        const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'BOARD_OF_DIRECTORS' || userRole === 'GUARD';

        if (!isAdmin && !isReporter) return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });

        // Reporters can only cancel or update priority/type if status is still REPORTED
        if (!isAdmin && isReporter) {
            const data = validation.data;
            if (currentIncident.status !== 'REPORTED' && data.status !== 'CANCELLED') {
                return NextResponse.json({ success: false, error: { message: 'No puedes modificar un incidente en proceso' } }, { status: 400 });
            }
        }

        const incident = await prisma.incident.update({
            where: { id },
            data: validation.data,
            include: { resolver: { select: { id: true, name: true } } }
        });

        return NextResponse.json({ success: true, data: incident });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
    }
}

/**
 * DELETE /api/incidents/[id]
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

        const { id } = await params;
        const incident = await prisma.incident.findUnique({ where: { id } });

        if (!incident) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });

        // Only Reporter (Resident) can delete if status is REPORTED. 
        // Admin, Super Admin, Guards, Operators CANNOT delete.
        const isReporter = incident.reporterId === session.user.id;

        if (!isReporter || incident.status !== 'REPORTED') {
            return NextResponse.json({
                success: false,
                error: { code: 'FORBIDDEN', message: 'No tienes permisos para eliminar este incidente.' }
            }, { status: 403 });
        }

        await prisma.incident.delete({ where: { id } });

        return NextResponse.json({ success: true, message: 'Incidente eliminado' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
    }
}

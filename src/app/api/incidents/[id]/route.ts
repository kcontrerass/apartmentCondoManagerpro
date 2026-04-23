import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { updateIncidentSchema } from '@/lib/validations/incident';
import { sendUserNotification } from '@/lib/notifications';
import { pushDashboardUrl } from '@/lib/push-dashboard-paths';

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
        const incident: any = await prisma.incident.findUnique({
            where: { id },
            include: {
                reporter: { select: { id: true, name: true, image: true, email: true, phone: true } },
                resolver: { select: { id: true, name: true } },
                complex: { select: { id: true, name: true } },
                unit: { select: { id: true, number: true } }
            }
        });

        if (incident) {
            try {
                // Fetch comments using RAW SQL to bypass Prisma client desync
                const rawComments: any[] = await prisma.$queryRawUnsafe(
                    `SELECT c.id, c.content, c.created_at as createdAt, 
                            u.id as authorId, u.name as authorName, u.image as authorImage, u.role as authorRole
                     FROM incident_comments c
                     JOIN users u ON c.author_id = u.id
                     WHERE c.incident_id = ?
                     ORDER BY c.created_at ASC`,
                    id
                );

                incident.comments = rawComments.map(c => ({
                    id: c.id,
                    content: c.content,
                    createdAt: c.createdAt,
                    author: {
                        id: c.authorId,
                        name: c.authorName,
                        image: c.authorImage,
                        role: c.authorRole
                    }
                }));
            } catch (rawError: any) {
                console.warn(`[INCIDENT_GET_RAW_ERROR] Failed to fetch comments: ${rawError.message}`);
                incident.comments = [];
            }
        }

        if (!incident) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });

        // Access check
        const userRole = session.user.role;
        const userComplexId = (session.user as any).complexId;

        console.debug(`[INCIDENT_GET] ID: ${id} | Role: ${userRole} | UserComplexId: ${userComplexId} | IncidentComplexId: ${incident.complexId}`);

        if (userRole === 'SUPER_ADMIN') {
            // Super admin has full access
        } else if (userRole === 'RESIDENT') {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id },
                select: { unitId: true }
            });
            const isReporter = incident.reporterId === session.user.id;
            const isConcernedUnit = incident.unitId === resident?.unitId;

            if (!isReporter && !isConcernedUnit) {
                console.warn(`[INCIDENT_FORBIDDEN] Resident ${session.user.id} not reporter AND not in unit ${incident.unitId}`);
                return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
            }
        } else if (['ADMIN', 'BOARD_OF_DIRECTORS', 'GUARD'].includes(userRole)) {
            // Check if incident belongs to user's complex
            if (incident.complexId !== userComplexId) {
                // Double check: if session is desynced, try to fetch from DB
                const userObj = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    select: {
                        complexId: true,
                        managedComplexes: { select: { id: true } },
                        residentProfile: { include: { unit: true } }
                    }
                });

                let actualComplexId = userObj?.complexId || userObj?.managedComplexes?.id || userObj?.residentProfile?.unit?.complexId;

                if (incident.complexId !== actualComplexId) {
                    console.warn(`[INCIDENT_FORBIDDEN] ActualComplexId: ${actualComplexId} does not match Incident: ${incident.complexId}`);
                    return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
                }
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

        const incident: any = await prisma.incident.update({
            where: { id },
            data: validation.data,
            include: {
                resolver: { select: { id: true, name: true } },
                complex: { select: { id: true, name: true } }
            }
        });

        // Notify reporter on status change
        if (validation.data.status && validation.data.status !== currentIncident.status) {
            await sendUserNotification(currentIncident.reporterId, {
                title: `Incidente Actualizado: ${currentIncident.title}`,
                body: `El estado ha cambiado a: ${incident.status}`,
                url: pushDashboardUrl.incident(id)
            });
        }

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

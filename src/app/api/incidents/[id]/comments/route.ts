import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { Role } from '@/types/roles';
import { sendUserNotification } from '@/lib/notifications';
import { pushDashboardUrl } from '@/lib/push-dashboard-paths';

/**
 * POST /api/incidents/[id]/comments
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED' } }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const { content } = body;

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json({ success: false, error: { message: 'El contenido del mensaje es requerido' } }, { status: 400 });
        }

        // Verify incident existence and access
        const incident = await prisma.incident.findUnique({
            where: { id },
            select: { complexId: true, reporterId: true, resolverId: true, unitId: true },
        });

        if (!incident) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND' } }, { status: 404 });

        // RBAC: Resident can only comment on their own incidents. 
        // Admin, Board, Guard can comment on incidents in their complex.
        const userRole = session.user.role;
        const userId = session.user.id;
        const userComplexId = (session.user as any).complexId;

        if (userRole === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: userId },
                select: { unitId: true }
            });
            const isReporter = incident.reporterId === userId;
            const isConcernedUnit = incident.unitId === resident?.unitId;

            if (!isReporter && !isConcernedUnit) {
                return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
            }
        }

        if ((userRole === Role.ADMIN || userRole === Role.BOARD_OF_DIRECTORS || userRole === Role.GUARD) && incident.complexId !== userComplexId) {
            return NextResponse.json({ success: false, error: { code: 'FORBIDDEN' } }, { status: 403 });
        }

        // Use RAW SQL to insert the comment to bypass Prisma client desync
        const commentId = `cmm${Math.random().toString(36).substring(2, 11)}`; // Fallback CUID-like ID

        try {
            await prisma.$executeRawUnsafe(
                `INSERT INTO incident_comments (id, content, incident_id, author_id, created_at, updated_at)
                 VALUES (?, ?, ?, ?, NOW(), NOW())`,
                commentId, content.trim(), id, userId
            );

            // Fetch the author info to return in the response
            const author = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, name: true, image: true, role: true }
            });

            const newComment = {
                id: commentId,
                content: content.trim(),
                createdAt: new Date(),
                author
            };

            const snippet =
                `${content.trim().substring(0, 50)}${content.length > 50 ? "…" : ""}`;

            if (userRole === Role.RESIDENT) {
                const complex = await prisma.complex.findUnique({
                    where: { id: incident.complexId },
                    select: { adminId: true },
                });
                const recipients = new Set<string>();
                if (complex?.adminId && complex.adminId !== userId) recipients.add(complex.adminId);
                if (incident.resolverId && incident.resolverId !== userId) {
                    recipients.add(incident.resolverId);
                }
                for (const uid of recipients) {
                    await sendUserNotification(uid, {
                        title: "Nuevo comentario en incidente",
                        body: `${author?.name || "Un residente"}: ${snippet}`,
                        url: pushDashboardUrl.incident(id),
                    });
                }
            } else {
                const recipients = new Set<string>();
                if (incident.reporterId && incident.reporterId !== userId) {
                    recipients.add(incident.reporterId);
                }
                if (incident.resolverId && incident.resolverId !== userId) {
                    recipients.add(incident.resolverId);
                }
                for (const uid of recipients) {
                    await sendUserNotification(uid, {
                        title: "Actualización en tu incidente",
                        body: `${author?.name || "Administración"}: ${snippet}`,
                        url: pushDashboardUrl.incident(id),
                    });
                }
            }

            return NextResponse.json({ success: true, data: newComment });
        } catch (rawError: any) {
            console.error('[INCIDENT_COMMENT_POST_RAW_ERROR]', rawError);
            return NextResponse.json({ success: false, error: { message: 'Error al guardar el mensaje en la base de datos.' } }, { status: 500 });
        }
    } catch (error: any) {
        console.error('[INCIDENT_COMMENT_POST]', error);
        return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
    }
}

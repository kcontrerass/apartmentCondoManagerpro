import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { announcementUpdateSchema } from '@/lib/validations/announcement';

/**
 * GET /api/announcements/[id]
 * Get detailed information about an announcement
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

        const announcement = await prisma.announcement.findUnique({
            where: { id },
            include: {
                complex: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!announcement) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Aviso no encontrado' } },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                ...announcement,
                targetRoles: announcement.targetRoles ? (announcement.targetRoles as string[]) : null,
            },
        });
    } catch (error) {
        console.error('Error fetching announcement detail:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al obtener detalle de aviso' } },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/announcements/[id]
 * Update an existing announcement
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

        // Validate permission
        const userRole = session.user.role;
        if (!['SUPER_ADMIN', 'ADMIN', 'BOARD_OF_DIRECTORS'].includes(userRole)) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para editar avisos' } },
                { status: 403 }
            );
        }

        // Get current announcement
        const currentAnnouncement = await prisma.announcement.findUnique({
            where: { id },
        });

        if (!currentAnnouncement) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Aviso no encontrado' } },
                { status: 404 }
            );
        }

        // Check ownership/complex permission
        if (userRole !== 'SUPER_ADMIN') {
            const isAuthor = currentAnnouncement.authorId === session.user.id;
            const isAdminInSameComplex = userRole === 'ADMIN' && currentAnnouncement.complexId === (session.user as any).complexId;

            if (!isAuthor && !isAdminInSameComplex) {
                return NextResponse.json(
                    { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permiso para modificar este aviso' } },
                    { status: 403 }
                );
            }
        }

        // Validate input
        const validation = announcementUpdateSchema.safeParse(body);
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

        // Update announcement
        const updatedAnnouncement = await prisma.announcement.update({
            where: { id },
            data: {
                title: data.title,
                content: data.content,
                priority: data.priority,
                targetRoles: data.targetRoles as any,
                imageUrl: data.imageUrl,
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : undefined,
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
            },
            include: {
                complex: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                ...updatedAnnouncement,
                targetRoles: updatedAnnouncement.targetRoles ? (updatedAnnouncement.targetRoles as string[]) : null,
            },
            message: 'Aviso actualizado exitosamente',
        });
    } catch (error) {
        console.error('Error updating announcement:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al actualizar aviso' } },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/announcements/[id]
 * Delete an announcement
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

        // Check permissions
        const userRole = session.user.role;
        if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para eliminar avisos' } },
                { status: 403 }
            );
        }

        // Get current announcement to check complex
        const announcement = await prisma.announcement.findUnique({
            where: { id },
        });

        if (!announcement) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Aviso no encontrado' } },
                { status: 404 }
            );
        }

        // Complex check for ADMIN
        if (userRole === 'ADMIN' && announcement.complexId !== (session.user as any).complexId) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para eliminar avisos de otro complejo' } },
                { status: 403 }
            );
        }

        await prisma.announcement.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Aviso eliminado exitosamente',
        });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al eliminar el aviso' } },
            { status: 500 }
        );
    }
}

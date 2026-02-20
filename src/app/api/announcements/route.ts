import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { announcementCreateSchema } from '@/lib/validations/announcement';

/**
 * GET /api/announcements
 * List announcements across all complexes (SUPER_ADMIN only)
 * 
 * Query params:
 * - priority: Filter by priority
 * - status: Filter by status (active, expired, all)
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

        // Only SUPER_ADMIN can access global announcements
        if (session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para acceder a esta ruta' } },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const priority = searchParams.get('priority');
        const status = searchParams.get('status') || 'active';
        const limit = parseInt(searchParams.get('limit') || '50');
        const search = searchParams.get('search');

        // Build where clause
        const where: any = {};

        if (search) {
            where.title = { contains: search, mode: 'insensitive' };
        }

        if (priority) {
            where.priority = priority;
        }

        const now = new Date();
        const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

        if (status === 'active') {
            where.OR = [
                { expiresAt: null },
                { expiresAt: { gte: now } },
            ];
            where.publishedAt = { lte: tenMinutesFromNow };
        } else if (status === 'expired') {
            where.expiresAt = { lt: now };
        }

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

        return NextResponse.json({
            success: true,
            data: {
                announcements,
                count: announcements.length,
            },
        });
    } catch (error: any) {
        console.error('Error fetching global announcements:', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Error al obtener avisos globales' } },
            { status: 500 }
        );
    }
}

/**
 * POST /api/announcements
 * Create a new announcement
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
                { success: false, error: { code: 'FORBIDDEN', message: 'No tienes permisos para crear avisos' } },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Validate input
        const validation = announcementCreateSchema.safeParse(body);
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

        // Verify complex exists and user has access
        const complex = await prisma.complex.findUnique({
            where: { id: data.complexId },
        });

        if (!complex) {
            return NextResponse.json(
                { success: false, error: { code: 'NOT_FOUND', message: 'Complejo no encontrado' } },
                { status: 404 }
            );
        }

        // Check if user belongs to this complex (except SUPER_ADMIN)
        if (userRole !== 'SUPER_ADMIN' && (session.user as any).complexId !== data.complexId) {
            return NextResponse.json(
                { success: false, error: { code: 'FORBIDDEN', message: 'No tienes acceso a este complejo' } },
                { status: 403 }
            );
        }

        // Create announcement
        const announcement = await prisma.announcement.create({
            data: {
                complexId: data.complexId,
                title: data.title,
                content: data.content,
                priority: data.priority || 'NORMAL',
                targetRoles: data.targetRoles as any,
                imageUrl: data.imageUrl || null,
                publishedAt: (data.publishedAt && data.publishedAt.trim() !== '')
                    ? new Date(data.publishedAt)
                    : new Date(),
                expiresAt: (data.expiresAt && data.expiresAt.trim() !== '')
                    ? new Date(data.expiresAt)
                    : null,
                authorId: session.user.id!,
                authorName: session.user.name || 'Administración',
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

        return NextResponse.json(
            {
                success: true,
                data: announcement,
                message: 'Aviso creado exitosamente',
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating announcement:', error);
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: error.message || 'Error al crear el aviso',
                    details: error
                }
            },
            { status: 500 }
        );
    }
}

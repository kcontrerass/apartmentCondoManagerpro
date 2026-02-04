import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/complexes/[id]/incidents
 * List incidents for a specific complex
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

        // Access check
        if (session.user.role !== 'SUPER_ADMIN') {
            const userComplexId = (session.user as any).complexId;
            if (userComplexId !== complexId) {
                return NextResponse.json(
                    { success: false, error: { code: 'FORBIDDEN', message: 'No tienes acceso a este complejo' } },
                    { status: 403 }
                );
            }
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const type = searchParams.get('type');
        const search = searchParams.get('search');

        const where: any = { complexId };

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
                unit: {
                    select: { id: true, number: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({
            success: true,
            data: incidents,
        });
    } catch (error: any) {
        console.error('[COMPLEX_INCIDENTS_GET]', error);
        return NextResponse.json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: error.message } },
            { status: 500 }
        );
    }
}

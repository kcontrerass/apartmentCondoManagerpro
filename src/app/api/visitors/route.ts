import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { visitorLogSchema } from "@/lib/validations/visitor";
import { Role } from "@/types/roles";
import { sendUserNotification, sendComplexNotification } from "@/lib/notifications";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const complexId = searchParams.get("complexId");
        const unitId = searchParams.get("unitId");
        const status = searchParams.get("status");

        const where: any = {};
        if (complexId) where.complexId = complexId;
        if (unitId) where.unitId = unitId;
        if (status) where.status = status;

        // RBAC
        if (session.user.role === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id }
            });
            if (resident) {
                where.unitId = resident.unitId;
            }
        } else if (session.user.role === Role.ADMIN) {
            where.complex = { adminId: session.user.id };
        } else if (session.user.role === Role.BOARD_OF_DIRECTORS || session.user.role === Role.GUARD) {
            const user = await (prisma as any).user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true }
            });
            if (user?.complexId) {
                where.complexId = user.complexId;
            } else {
                where.complexId = "none";
            }
        }

        const logs = await (prisma as any).visitorLog.findMany({
            where,
            include: {
                unit: { select: { number: true } },
                complex: { select: { name: true } },
                createdBy: { select: { name: true } }
            },
            orderBy: { scheduledDate: "desc" }
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("Error fetching visitors:", error);
        return NextResponse.json({ error: "Error al obtener visitantes" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = visitorLogSchema.parse(body);

        const log = await (prisma as any).visitorLog.create({
            data: {
                visitorName: validatedData.visitorName,
                visitorId: validatedData.visitorId,
                reason: validatedData.reason,
                scheduledDate: new Date(validatedData.scheduledDate),
                unitId: validatedData.unitId,
                complexId: validatedData.complexId,
                createdById: session.user.id!,
                status: validatedData.status || "SCHEDULED"
            }
        });

        // Notify the resident of the unit
        if (validatedData.unitId) {
            const resident = await prisma.resident.findFirst({
                where: { unitId: validatedData.unitId },
                select: { userId: true }
            });

            if (resident && resident.userId !== session.user.id) {
                await sendUserNotification(resident.userId, {
                    title: 'Visitante Programado',
                    body: `Se ha programado una visita para: ${validatedData.visitorName}`,
                    url: '/dashboard/visitors'
                });
            }
        }

        // Notify guards and admins of the complex
        await sendComplexNotification(validatedData.complexId, ['GUARD', 'ADMIN', 'BOARD_OF_DIRECTORS', 'SUPER_ADMIN'], {
            title: 'Nueva Visita Programada',
            body: `Se ha registrado una visita para la unidad ${log.unitId || ''}: ${validatedData.visitorName}`,
            url: '/dashboard/visitors'
        });

        return NextResponse.json(log, { status: 201 });
    } catch (error) {
        console.error("Error creating visitor log:", error);
        return NextResponse.json({ error: "Error al registrar visitante" }, { status: 500 });
    }
}

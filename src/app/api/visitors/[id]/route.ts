import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { Role } from "@/types/roles";
import { sendUserNotification, sendComplexNotification } from "@/lib/notifications";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        const updateData: any = { status };

        if (status === "ARRIVED") {
            updateData.entryTime = new Date();
        } else if (status === "DEPARTED") {
            updateData.exitTime = new Date();
        }

        const log = await prisma.visitorLog.update({
            where: { id },
            data: updateData
        });

        // Notify the resident of the unit when visitor arrives
        if (status === "ARRIVED" && log.unitId) {
            const resident = await prisma.resident.findFirst({
                where: { unitId: log.unitId },
                select: { userId: true }
            });

            if (resident) {
                // Notify the resident specifically
                await sendUserNotification(resident.userId, {
                    title: 'Visitante en Portería',
                    body: `${log.visitorName} ha llegado al complejo.`,
                    url: '/dashboard/visitors'
                });
            }

            // Notify administrative staff
            await sendComplexNotification(log.complexId, ['ADMIN', 'BOARD_OF_DIRECTORS', 'SUPER_ADMIN'], {
                title: 'Check-in de Visitante',
                body: `${log.visitorName} ha ingresado para la unidad ${log.unitId || ''}.`,
                url: '/dashboard/visitors'
            });
        } else if (status === "DEPARTED" && log.unitId) {
            const resident = await prisma.resident.findFirst({
                where: { unitId: log.unitId },
                select: { userId: true }
            });

            if (resident) {
                // Notify the resident
                await sendUserNotification(resident.userId, {
                    title: 'Salida de Visitante',
                    body: `${log.visitorName} ha salido del complejo.`,
                    url: '/dashboard/visitors'
                });
            }

            // Notify administrative staff
            await sendComplexNotification(log.complexId, ['ADMIN', 'BOARD_OF_DIRECTORS', 'SUPER_ADMIN'], {
                title: 'Check-out de Visitante',
                body: `${log.visitorName} ha salido del complejo (Unidad ${log.unitId || ''}).`,
                url: '/dashboard/visitors'
            });
        }

        return NextResponse.json(log);
    } catch (error) {
        console.error("Error updating visitor log:", error);
        return NextResponse.json({ error: "Error al actualizar visitante" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        await prisma.visitorLog.delete({
            where: { id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting visitor log:", error);
        return NextResponse.json({ error: "Error al eliminar visitante" }, { status: 500 });
    }
}

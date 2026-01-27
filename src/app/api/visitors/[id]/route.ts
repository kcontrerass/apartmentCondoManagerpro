import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Role } from "@prisma/client";

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

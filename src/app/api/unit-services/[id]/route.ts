import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateUnitServiceSchema } from "@/lib/validations/service";
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
        const validatedData = updateUnitServiceSchema.parse(body);

        const unitService = await prisma.unitService.findUnique({
            where: { id },
            include: {
                unit: {
                    include: { complex: true }
                }
            },
        });

        if (!unitService) {
            return NextResponse.json({ error: "Asignación no encontrada" }, { status: 404 });
        }

        // RBAC: Only SUPER_ADMIN or the ADMIN of the complex
        if (session.user.role === Role.ADMIN && unitService.unit.complex.adminId !== session.user.id) {
            return NextResponse.json(
                { error: "No tiene permiso para editar esta asignación" },
                { status: 403 }
            );
        } else if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            return NextResponse.json(
                { error: "Solo administradores pueden editar asignaciones" },
                { status: 403 }
            );
        }

        const updatedUnitService = await prisma.unitService.update({
            where: { id },
            data: validatedData,
        });

        return NextResponse.json(updatedUnitService);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error updating unit service:", error);
        return NextResponse.json(
            { error: "Error al actualizar la asignación" },
            { status: 500 }
        );
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

        const unitService = await prisma.unitService.findUnique({
            where: { id },
            include: {
                unit: {
                    include: { complex: true }
                }
            },
        });

        if (!unitService) {
            return NextResponse.json({ error: "Asignación no encontrada" }, { status: 404 });
        }

        // RBAC: Only SUPER_ADMIN or the ADMIN of the complex
        if (session.user.role === Role.ADMIN && unitService.unit.complex.adminId !== session.user.id) {
            return NextResponse.json(
                { error: "No tiene permiso para eliminar esta asignación" },
                { status: 403 }
            );
        } else if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            return NextResponse.json(
                { error: "Solo administradores pueden eliminar asignaciones" },
                { status: 403 }
            );
        }

        await prisma.unitService.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting unit service:", error);
        return NextResponse.json(
            { error: "Error al eliminar la asignación" },
            { status: 500 }
        );
    }
}

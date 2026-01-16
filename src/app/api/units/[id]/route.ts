import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { unitSchema } from "@/lib/validations/unit";
import { Role } from "@prisma/client";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const unit = await prisma.unit.findUnique({
            where: { id },
            include: {
                complex: true,
                residents: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!unit) {
            return NextResponse.json({ error: "Unidad no encontrada" }, { status: 404 });
        }

        return NextResponse.json(unit);
    } catch (error) {
        return NextResponse.json(
            { error: "Error al obtener la unidad" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = unitSchema.partial().parse(body);

        // If number is changing, check for collision
        if (validatedData.number) {
            const currentUnit = await prisma.unit.findUnique({
                where: { id },
                select: { complexId: true }
            });

            if (currentUnit) {
                const collision = await prisma.unit.findUnique({
                    where: {
                        complexId_number: {
                            complexId: currentUnit.complexId,
                            number: validatedData.number,
                        }
                    }
                });

                if (collision && collision.id !== id) {
                    return NextResponse.json(
                        { error: "Ya existe otra unidad con ese número en este complejo" },
                        { status: 400 }
                    );
                }
            }
        }

        const unit = await prisma.unit.update({
            where: { id },
            data: validatedData,
        });

        return NextResponse.json(unit);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Error al actualizar la unidad" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        await prisma.unit.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Unidad eliminada exitosamente" });
    } catch (error) {
        return NextResponse.json(
            { error: "Error al eliminar la unidad" },
            { status: 500 }
        );
    }
}

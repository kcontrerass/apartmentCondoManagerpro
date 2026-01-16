import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { residentSchema } from "@/lib/validations/resident";
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

        const resident = await prisma.resident.findUnique({
            where: { id },
            include: {
                user: true,
                unit: {
                    include: {
                        complex: true,
                    },
                },
            },
        });

        if (!resident) {
            return NextResponse.json({ error: "Residente no encontrado" }, { status: 404 });
        }

        return NextResponse.json(resident);
    } catch (error) {
        return NextResponse.json(
            { error: "Error al obtener el residente" },
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
        const validatedData = residentSchema.partial().parse(body);

        // Verify user exists if provided
        if (validatedData.userId) {
            const userExists = await prisma.user.findUnique({
                where: { id: validatedData.userId }
            });
            if (!userExists) {
                return NextResponse.json({ error: "El usuario especificado no existe" }, { status: 404 });
            }

            // Check if user is already a resident (and not the same record)
            const existingResident = await prisma.resident.findUnique({
                where: { userId: validatedData.userId }
            });
            if (existingResident && existingResident.id !== id) {
                return NextResponse.json({ error: "Este usuario ya está asignado como residente a otra unidad" }, { status: 400 });
            }
        }

        // Verify unit exists if provided
        if (validatedData.unitId) {
            const unitExists = await prisma.unit.findUnique({
                where: { id: validatedData.unitId }
            });
            if (!unitExists) {
                return NextResponse.json({ error: "La unidad especificada no existe" }, { status: 404 });
            }
        }

        const resident = await prisma.resident.update({
            where: { id },
            data: {
                ...validatedData,
                // Transformations for dates if they are in the partial data
                startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
                endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
            },
        });

        return NextResponse.json(resident);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Error al actualizar el residente" },
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

        await prisma.resident.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Residente eliminado exitosamente" });
    } catch (error) {
        return NextResponse.json(
            { error: "Error al eliminar el residente" },
            { status: 500 }
        );
    }
}

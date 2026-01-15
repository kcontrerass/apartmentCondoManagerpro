import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ComplexUpdateSchema } from "@/lib/validations/complex";
import { Role } from "@prisma/client";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(
    request: Request,
    { params }: RouteParams
) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const complex = await prisma.complex.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        units: true,
                        amenities: true,
                    },
                },
                admin: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!complex) {
            return NextResponse.json({ error: "Complejo no encontrado" }, { status: 404 });
        }

        return NextResponse.json(complex);
    } catch (error) {
        console.error("Error fetching complex:", error);
        return NextResponse.json(
            { error: "Error al obtener el complejo" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: RouteParams
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        // Permissions check
        const existingComplex = await prisma.complex.findUnique({
            where: { id },
        });

        if (!existingComplex) {
            return NextResponse.json({ error: "Complejo no encontrado" }, { status: 404 });
        }

        if (
            session.user.role !== Role.SUPER_ADMIN &&
            session.user.role !== Role.ADMIN &&
            existingComplex.adminId !== session.user.id
        ) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = ComplexUpdateSchema.parse(body);

        const updatedComplex = await prisma.complex.update({
            where: { id },
            data: {
                name: validatedData.name,
                address: validatedData.address,
                type: validatedData.type,
                logoUrl: validatedData.logoUrl,
                settings: validatedData.settings || undefined,
                adminId: validatedData.adminId || undefined,
            },
        });

        return NextResponse.json(updatedComplex);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error updating complex:", error);
        return NextResponse.json(
            { error: "Error al actualizar el complejo" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: RouteParams
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        // Permissions check: Only SUPER_ADMIN or the assigned ADMIN can delete
        const existingComplex = await prisma.complex.findUnique({
            where: { id },
        });

        if (!existingComplex) {
            return NextResponse.json({ error: "Complejo no encontrado" }, { status: 404 });
        }

        if (
            session.user.role !== Role.SUPER_ADMIN &&
            existingComplex.adminId !== session.user.id
        ) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        await prisma.complex.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Complejo eliminado correctamente" });
    } catch (error) {
        console.error("Error deleting complex:", error);
        return NextResponse.json(
            { error: "Error al eliminar el complejo" },
            { status: 500 }
        );
    }
}

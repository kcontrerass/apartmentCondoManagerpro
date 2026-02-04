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

        const isSuperAdmin = session.user.role === Role.SUPER_ADMIN;

        if (!isSuperAdmin) {
            return NextResponse.json({ error: "Solo el Super Administrador puede actualizar complejos" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = ComplexUpdateSchema.parse(body);

        const updatedComplex = await prisma.$transaction(async (tx) => {
            const complex = await tx.complex.update({
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

            if (validatedData.adminId) {
                await tx.user.update({
                    where: { id: validatedData.adminId },
                    data: { complexId: complex.id }
                });
            }

            // If adminId was removed (explicitly null), we might want to unassign the user.
            // But validatedData.adminId via zod is usually string or undefined.
            // If the user wants to unassign, they might pass null, but Zod schema needs to be checked.
            // Assuming for now we are mostly establishing links.

            return complex;
        });

        return NextResponse.json(updatedComplex);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        if (error.code === 'P2002' && error.meta?.target?.includes('adminId')) {
            return NextResponse.json(
                { error: "El administrador seleccionado ya está asignado a otro complejo." },
                { status: 409 }
            );
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

        if (session.user.role !== Role.SUPER_ADMIN) {
            return NextResponse.json({ error: "Solo el Super Administrador puede eliminar complejos" }, { status: 403 });
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

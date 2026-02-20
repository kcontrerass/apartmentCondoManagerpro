import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { serviceUpdateSchema } from "@/lib/validations/service";
import { Role } from "@/types/roles";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await params;

        const service = await prisma.service.findUnique({
            where: { id },
            include: {
                complex: {
                    select: {
                        name: true,
                        adminId: true,
                    },
                },
            },
        });

        if (!service) {
            return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
        }

        // Role check for ADMIN: Can only see services of their complex
        if (session.user.role === Role.ADMIN && service.complex.adminId !== session.user.id) {
            return NextResponse.json({ error: "No tiene permiso para ver este servicio" }, { status: 403 });
        }

        return NextResponse.json(service);
    } catch (error) {
        console.error("Error fetching service:", error);
        return NextResponse.json(
            { error: "Error al obtener el servicio" },
            { status: 500 }
        );
    }
}

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
        const validatedData = serviceUpdateSchema.parse(body);

        const service = await prisma.service.findUnique({
            where: { id },
            include: { complex: true },
        });

        if (!service) {
            return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
        }

        // RBAC: Only SUPER_ADMIN or the ADMIN of the complex
        if (session.user.role === Role.ADMIN && service.complex.adminId !== session.user.id) {
            return NextResponse.json(
                { error: "No tiene permiso para editar este servicio" },
                { status: 403 }
            );
        } else if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            return NextResponse.json(
                { error: "Solo administradores pueden editar servicios" },
                { status: 403 }
            );
        }

        const updatedService = await prisma.service.update({
            where: { id },
            data: validatedData,
        });

        return NextResponse.json(updatedService);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error updating service:", error);
        return NextResponse.json(
            { error: "Error al actualizar el servicio" },
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

        const service = await prisma.service.findUnique({
            where: { id },
            include: { complex: true },
        });

        if (!service) {
            return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
        }

        // RBAC: Only SUPER_ADMIN or the ADMIN of the complex
        if (session.user.role === Role.ADMIN && service.complex.adminId !== session.user.id) {
            return NextResponse.json(
                { error: "No tiene permiso para eliminar este servicio" },
                { status: 403 }
            );
        } else if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            return NextResponse.json(
                { error: "Solo administradores pueden eliminar servicios" },
                { status: 403 }
            );
        }

        await prisma.service.delete({
            where: { id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Error deleting service:", error);
        return NextResponse.json(
            { error: "Error al eliminar el servicio" },
            { status: 500 }
        );
    }
}

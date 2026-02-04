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

        // RBAC: Only SUPER_ADMIN, complex ADMIN, or the unit RESIDENT
        if (session.user.role === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id },
                select: { unitId: true }
            });

            if (!resident || resident.unitId !== unitService.unitId) {
                return NextResponse.json(
                    { error: "No tiene permiso para editar esta asignación" },
                    { status: 403 }
                );
            }

            // A resident cannot edit a mandatory service
            const service = await prisma.service.findUnique({
                where: { id: unitService.serviceId },
                select: { isRequired: true }
            });

            if (service?.isRequired) {
                return NextResponse.json(
                    { error: "No se puede editar un servicio obligatorio" },
                    { status: 403 }
                );
            }
        } else if (session.user.role === Role.ADMIN && unitService.unit.complex.adminId !== session.user.id) {
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

        // RBAC: Only SUPER_ADMIN, complex ADMIN, or the unit RESIDENT
        if (session.user.role === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id },
                select: { unitId: true }
            });

            if (!resident || resident.unitId !== unitService.unitId) {
                return NextResponse.json(
                    { error: "No tiene permiso para eliminar esta asignación" },
                    { status: 403 }
                );
            }

            // A resident cannot delete a mandatory service
            const service = await prisma.service.findUnique({
                where: { id: unitService.serviceId },
                select: { isRequired: true }
            });

            if (service?.isRequired) {
                return NextResponse.json(
                    { error: "No se puede eliminar un servicio obligatorio" },
                    { status: 403 }
                );
            }

            // Enforce 1-month retention period for residents
            const startDate = new Date(unitService.startDate);
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            if (startDate > oneMonthAgo) {
                return NextResponse.json(
                    { error: "Debe cumplir al menos un mes de contratación para dar de baja este servicio." },
                    { status: 403 }
                );
            }
        } else if (session.user.role === Role.ADMIN && unitService.unit.complex.adminId !== session.user.id) {
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

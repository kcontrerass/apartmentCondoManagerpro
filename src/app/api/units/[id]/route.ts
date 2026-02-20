import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { unitSchema } from "@/lib/validations/unit";
import { Role } from "@/types/roles";

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

        const { services, serviceIds, ...unitData } = validatedData as any;

        // If number is changing, check for collision
        if (unitData.number) {
            const currentUnit = await prisma.unit.findUnique({
                where: { id },
                select: { complexId: true }
            });

            if (currentUnit) {
                const collision = await prisma.unit.findUnique({
                    where: {
                        complexId_number: {
                            complexId: currentUnit.complexId,
                            number: unitData.number,
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

        const unit = await prisma.$transaction(async (tx) => {
            // 1. Update unit details
            const updatedUnit = await tx.unit.update({
                where: { id },
                data: unitData,
                include: { complex: true }
            });

            // 2. Handle Services Update if provided
            if (services || serviceIds) {
                // Get mandatory services
                const mandatoryServices = await tx.service.findMany({
                    where: {
                        complexId: updatedUnit.complexId,
                        isRequired: true,
                    },
                    select: { id: true }
                });

                // Prepare Map of ServiceId -> Quantity
                const servicesToAssign = new Map<string, number>();

                // 1. Add mandatory services (default qty 1)
                mandatoryServices.forEach(s => servicesToAssign.set(s.id, 1));

                // 2. Add/Overwrite with provided services
                if (Array.isArray(services)) {
                    services.forEach((s: any) => {
                        servicesToAssign.set(s.id, s.quantity || 1);
                    });
                }

                if (Array.isArray(serviceIds)) {
                    serviceIds.forEach((id: string) => {
                        if (!servicesToAssign.has(id)) {
                            servicesToAssign.set(id, 1);
                        }
                    });
                }

                // 3. Sync UnitServices
                await tx.unitService.deleteMany({
                    where: { unitId: id }
                });

                if (servicesToAssign.size > 0) {
                    await tx.unitService.createMany({
                        data: Array.from(servicesToAssign.entries()).map(([serviceId, quantity]) => ({
                            unitId: id,
                            serviceId,
                            quantity,
                            status: "ACTIVE",
                            startDate: new Date(),
                        }))
                    });
                }
            }

            return updatedUnit;
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

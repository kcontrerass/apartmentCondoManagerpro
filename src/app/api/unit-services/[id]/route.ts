import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { updateUnitServiceSchema } from "@/lib/validations/service";
import { Role } from "@/types/roles";

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
                },
                service: true
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
            if (unitService.service.isRequired) {
                return NextResponse.json(
                    { error: "No se puede eliminar un servicio obligatorio" },
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

        // Adjust invoice if a PENDING one exists for the current month
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const itemWithInvoice = await prisma.invoiceItem.findFirst({
            where: {
                serviceId: unitService.serviceId,
                invoice: {
                    unitId: unitService.unitId,
                    month,
                    year,
                    status: "PENDING"
                }
            },
            include: {
                invoice: true
            }
        });

        if (itemWithInvoice) {
            const { invoice, ...item } = itemWithInvoice;
            const lastDayOfMonth = new Date(year, month, 0).getDate();
            const startDate = new Date(unitService.startDate);
            let activeDays = now.getDate();

            // If the service started this month or earlier, we calculate its usage
            if (startDate.getFullYear() === year && (startDate.getMonth() + 1) === month) {
                activeDays = Math.max(0, now.getDate() - startDate.getDate() + 1);
            } else if (startDate > now) {
                activeDays = 0;
            }

            // Only adjust if cancellation happens before the last day of the month
            if (activeDays < lastDayOfMonth) {
                const basePrice = Number(unitService.customPrice ?? unitService.service.basePrice);
                const quantity = unitService.quantity || 1;
                const fullMonthAmount = basePrice * quantity;

                const proratedAmount = Number(((fullMonthAmount / lastDayOfMonth) * activeDays).toFixed(2));
                const originalItemAmount = Number(item.amount);
                const difference = originalItemAmount - proratedAmount;

                if (difference > 0) {
                    await prisma.$transaction([
                        prisma.invoiceItem.update({
                            where: { id: item.id },
                            data: {
                                amount: proratedAmount,
                                description: `${unitService.service.name}${quantity > 1 ? ` (x${quantity})` : ''} (Prorrateo final por cancelación)`
                            }
                        }),
                        prisma.invoice.update({
                            where: { id: invoice.id },
                            data: {
                                totalAmount: { decrement: difference }
                            }
                        })
                    ]);
                }
            }
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

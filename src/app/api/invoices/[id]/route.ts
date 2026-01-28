import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateInvoiceSchema } from "@/lib/validations/invoice";
import { Role } from "@prisma/client";

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

        const invoice = await (prisma as any).invoice.findUnique({
            where: { id },
            include: {
                unit: true,
                complex: true,
                items: true
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
        }

        // RBAC check
        if (session.user.role === Role.SUPER_ADMIN) {
            // Proceed
        } else if (session.user.role === Role.ADMIN) {
            if (invoice.complex.adminId !== session.user.id) {
                return NextResponse.json({ error: "No autorizado para este complejo" }, { status: 403 });
            }
        } else if (session.user.role === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id }
            });
            if (!resident || resident.unitId !== invoice.unitId) {
                return NextResponse.json({ error: "No tienes acceso a esta factura" }, { status: 403 });
            }
        }

        return NextResponse.json(invoice);
    } catch (error) {
        console.error("Error fetching invoice:", error);
        return NextResponse.json(
            { error: "Error al obtener la factura" },
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
        const validatedData = updateInvoiceSchema.parse(body);

        const invoice = await (prisma as any).invoice.findUnique({
            where: { id },
            include: { complex: true }
        });

        if (!invoice) {
            return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
        }

        // RBAC: SUPER_ADMIN has full access
        if (session.user.role === Role.SUPER_ADMIN) {
            // Proceed
        } else if (session.user.role === Role.ADMIN) {
            if (invoice.complex.adminId !== session.user.id) {
                console.warn(`403: Admin ${session.user.id} tried to update invoice ${id} for complex ${invoice.complexId} (owned by ${invoice.complex.adminId})`);
                return NextResponse.json({ error: "No autorizado para este complejo" }, { status: 403 });
            }
        } else if (session.user.role === Role.RESIDENT) {
            return NextResponse.json({ error: "Los residentes no pueden editar facturas" }, { status: 403 });
        } else if (session.user.role !== Role.OPERATOR) {
            // For now allow OPERATOR, block others (like GUARD if they shouldn't mark as paid)
            return NextResponse.json({ error: "No tienes permiso para marcar facturas como pagadas" }, { status: 403 });
        }

        const updatedInvoice = await (prisma as any).invoice.update({
            where: { id },
            data: {
                status: validatedData.status
            }
        });

        // If marked as PAID, find linked reservation and approve it
        if (validatedData.status === "PAID") {
            const linkedReservation = await (prisma as any).reservation.findUnique({
                where: { invoiceId: id }
            });

            if (linkedReservation) {
                await (prisma as any).reservation.update({
                    where: { id: linkedReservation.id },
                    data: { status: 'APPROVED' }
                });
                console.log(`Reservation ${linkedReservation.id} approved via invoice update`);
            }
        }

        return NextResponse.json(updatedInvoice);
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error updating invoice:", error);
        return NextResponse.json(
            { error: "Error al actualizar la factura" },
            { status: 500 }
        );
    }
}

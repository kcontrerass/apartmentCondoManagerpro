import { NextResponse } from "next/server";
import { InvoiceCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { invoicePaymentIntentSchema } from "@/lib/validations/invoice";
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

        if (session.user.role !== Role.RESIDENT) {
            return NextResponse.json(
                { error: "Solo los residentes pueden indicar el método de pago" },
                { status: 403 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { method } = invoicePaymentIntentSchema.parse(body);

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            select: {
                id: true,
                unitId: true,
                status: true,
                category: true,
            },
        });

        if (!invoice) {
            return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
        }

        if (invoice.category === InvoiceCategory.PLATFORM_SUBSCRIPTION) {
            return NextResponse.json({ error: "Factura no válida" }, { status: 400 });
        }

        if (!invoice.unitId) {
            return NextResponse.json({ error: "Factura no válida" }, { status: 400 });
        }

        const resident = await prisma.resident.findUnique({
            where: { userId: session.user.id },
            select: { unitId: true },
        });

        if (!resident || resident.unitId !== invoice.unitId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        if (!["PENDING", "PROCESSING", "OVERDUE"].includes(invoice.status)) {
            return NextResponse.json(
                { error: "Esta factura no admite cambiar el método de pago" },
                { status: 400 }
            );
        }

        const updated = await prisma.invoice.update({
            where: { id },
            data: { paymentMethodIntent: method },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        if (error?.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("payment-intent PATCH:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { recurrente } from "@/lib/recurrente";
import { Role } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { invoiceId, method } = await request.json();

        if (!invoiceId) {
            return NextResponse.json({ error: "ID de factura requerido" }, { status: 400 });
        }

        const invoice = await (prisma as any).invoice.findUnique({
            where: { id: invoiceId },
            include: { unit: true }
        });

        if (!invoice) {
            return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
        }

        if (invoice.status !== "PENDING" && invoice.status !== "PROCESSING") {
            return NextResponse.json({ error: "Esta factura ya no está pendiente de pago" }, { status: 400 });
        }

        // RBAC: Only the resident of the unit or an admin can pay
        if (session.user.role === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id }
            });
            if (!resident || resident.unitId !== invoice.unitId) {
                return NextResponse.json({ error: "No tienes permiso para pagar esta factura" }, { status: 403 });
            }
        } else if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const locale = request.headers.get("referer")?.includes("/en/") ? "en" : "es";

        if (method === "CARD" || !method) {
            // Recurrente Checkout Creation
            const checkoutSession = await recurrente.checkouts.create({
                items: [{
                    name: `Factura ${invoice.number} - Periodo: ${invoice.month}/${invoice.year} - Unidad: ${invoice.unit.number}`,
                    currency: 'GTQ',
                    amount_in_cents: Math.round(Number(invoice.totalAmount) * 100),
                    quantity: 1,
                }],
                success_url: `${appUrl}/${locale}/dashboard/payments/success?invoice_id=${invoice.id}`,
                cancel_url: `${appUrl}/${locale}/dashboard/payments/cancel`,
                metadata: {
                    invoiceId: invoice.id,
                    unitId: invoice.unitId,
                }
            });

            // Update invoice with intended payment method
            await (prisma as any).invoice.update({
                where: { id: invoice.id },
                data: { paymentMethod: 'CARD' }
            });

            return NextResponse.json({ url: checkoutSession.checkout_url || checkoutSession.url });
        } else {
            // CASH or TRANSFER
            await (prisma as any).invoice.update({
                where: { id: invoice.id },
                data: {
                    status: "PROCESSING",
                    paymentMethod: method
                }
            });

            return NextResponse.json({ success: true });
        }

    } catch (error: any) {
        console.error("Error creating Recurrente checkout session:", error);
        return NextResponse.json(
            { error: "Error al procesar el pago" },
            { status: 500 }
        );
    }
}

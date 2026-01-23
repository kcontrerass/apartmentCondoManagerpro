import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { Role } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { invoiceId } = await request.json();

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

        if (invoice.status !== "PENDING") {
            return NextResponse.json({ error: "Esta factura ya no está pendiente" }, { status: 400 });
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

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd', // Adjust if needed
                        product_data: {
                            name: `Factura ${invoice.number}`,
                            description: `Periodo: ${invoice.month}/${invoice.year} - Unidad: ${invoice.unit.number}`,
                        },
                        unit_amount: Math.round(Number(invoice.totalAmount) * 100), // Stripe expects cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${appUrl}/${locale}/dashboard/payments/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/${locale}/dashboard/payments/cancel`,
            metadata: {
                invoiceId: invoice.id,
                unitId: invoice.unitId,
            },
        });

        return NextResponse.json({ url: checkoutSession.url });

    } catch (error: any) {
        console.error("Error creating checkout session:", error);
        return NextResponse.json(
            { error: "Error al procesar el pago" },
            { status: 500 }
        );
    }
}

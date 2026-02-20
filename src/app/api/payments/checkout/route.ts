import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { recurrente } from "@/lib/recurrente";
import { Role } from "@/types/roles";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { invoiceId, method, reservationData } = await request.json();

        // 1. Handle Reservation Payment (New Flow)
        if (reservationData) {
            const { amenityId, startTime, endTime, notes } = reservationData;

            const amenity = await prisma.amenity.findUnique({
                where: { id: amenityId },
                include: { complex: true }
            });

            if (!amenity) {
                return NextResponse.json({ error: "Amenidad no encontrada" }, { status: 404 });
            }

            // RBAC Check for Residents
            if (session.user.role === Role.RESIDENT) {
                const resident = await prisma.resident.findUnique({
                    where: { userId: session.user.id },
                    include: { unit: true }
                });
                if (!resident || !resident.unit || resident.unit.complexId !== amenity.complexId) {
                    return NextResponse.json({ error: "No puedes reservar amenidades fuera de tu complejo" }, { status: 403 });
                }
            }

            // --- RE-VALIDATE OPERATING HOURS (DRY attempt) ---
            if (amenity.operatingHours) {
                const hours = amenity.operatingHours as any;
                if (hours.open && hours.close) {
                    const GUATEMALA_OFFSET = 6 * 60 * 60 * 1000;
                    const startAdjusted = new Date(new Date(startTime).getTime() - GUATEMALA_OFFSET);
                    const endAdjusted = new Date(new Date(endTime).getTime() - GUATEMALA_OFFSET);

                    const isWithinHours = (date: Date) => {
                        const h = date.getUTCHours();
                        const m = date.getUTCMinutes();
                        const timeMinutes = h * 60 + m;
                        const [openH, openM] = hours.open.split(':').map(Number);
                        const [closeH, closeM] = hours.close.split(':').map(Number);
                        const openMinutes = openH * 60 + openM;
                        const closeMinutes = closeH * 60 + closeM;
                        if (openMinutes <= closeMinutes) return timeMinutes >= openMinutes && timeMinutes <= closeMinutes;
                        return timeMinutes >= openMinutes || timeMinutes <= closeMinutes;
                    };

                    const isWithinDays = (date: Date) => {
                        if (!hours.days || !Array.isArray(hours.days) || hours.days.length === 0) return true;
                        return hours.days.includes(date.getUTCDay());
                    };

                    if (!isWithinHours(startAdjusted) || !isWithinHours(endAdjusted) || !isWithinDays(startAdjusted) || !isWithinDays(endAdjusted)) {
                        return NextResponse.json({ error: "La amenidad no está disponible en este horario." }, { status: 400 });
                    }
                }
            }

            // Conflict Detection (Optimistic)
            const conflict = await (prisma as any).reservation.findFirst({
                where: {
                    amenityId,
                    status: 'APPROVED',
                    OR: [
                        { AND: [{ startTime: { lte: startTime } }, { endTime: { gt: startTime } }] },
                        { AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }] },
                        { AND: [{ startTime: { gte: startTime } }, { endTime: { lte: endTime } }] }
                    ]
                }
            });

            if (conflict) {
                return NextResponse.json({ error: "La amenidad ya está reservada en este horario." }, { status: 409 });
            }

            // Calculate Cost again in Backend
            let totalAmount = 0;
            const start = new Date(startTime);
            const end = new Date(endTime);
            const hoursDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            const daysDiff = Math.ceil(hoursDiff / 24);

            if (amenity.costPerHour) totalAmount = hoursDiff * Number(amenity.costPerHour);
            else if (amenity.costPerDay) totalAmount = daysDiff * Number(amenity.costPerDay);

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const locale = request.headers.get("referer")?.includes("/en/") ? "en" : "es";

            const checkoutSession = await recurrente.checkouts.create({
                items: [{
                    name: `Reserva: ${amenity.name} - ${amenity.complex?.name}`,
                    currency: 'GTQ',
                    amount_in_cents: Math.round(totalAmount * 100),
                    quantity: 1,
                }],
                success_url: `${appUrl}/${locale}/dashboard/payments/success`,
                cancel_url: `${appUrl}/${locale}/dashboard/payments/cancel`,
                metadata: {
                    type: 'RESERVATION',
                    amenityId,
                    startTime,
                    endTime,
                    notes,
                    userId: session.user.id,
                    totalAmount
                }
            });

            return NextResponse.json({ url: checkoutSession.checkout_url || checkoutSession.url });
        }

        // 2. Handle Existing Invoice Payment
        if (!invoiceId) {
            return NextResponse.json({ error: "ID de factura o datos de reserva requeridos" }, { status: 400 });
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
                    type: 'INVOICE',
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

import { InvoiceCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { recurrente } from "@/lib/recurrente";
import { Role } from "@/types/roles";
import { apiError, apiOk } from "@/lib/api-response";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return apiError({ code: "UNAUTHORIZED", message: "No autorizado" }, 401);
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
                return apiError({ code: "NOT_FOUND", message: "Amenidad no encontrada" }, 404);
            }

            // RBAC Check for Residents
            if (session.user.role === Role.RESIDENT) {
                const resident = await prisma.resident.findUnique({
                    where: { userId: session.user.id },
                    include: { unit: true }
                });
                if (!resident || !resident.unit || resident.unit.complexId !== amenity.complexId) {
                    return apiError(
                        { code: "FORBIDDEN", message: "No puedes reservar amenidades fuera de tu complejo" },
                        403
                    );
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
                        return apiError(
                            { code: "INVALID_TIME_WINDOW", message: "La amenidad no está disponible en este horario." },
                            400
                        );
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
                return apiError(
                    { code: "RESERVATION_CONFLICT", message: "La amenidad ya está reservada en este horario." },
                    409
                );
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

            const recurrenteKeys = (amenity.complex.settings as any)?.recurrente;

            const reservationSuccessUrl = `${appUrl}/${locale}/dashboard/payments/success?session_id={CHECKOUT_SESSION_ID}&complexId=${encodeURIComponent(amenity.complexId)}`;
            const checkoutSession = await recurrente.checkouts.create({
                items: [{
                    name: `Reserva: ${amenity.name} - ${amenity.complex?.name}`,
                    currency: 'GTQ',
                    amount_in_cents: Math.round(totalAmount * 100),
                    quantity: 1,
                }],
                success_url: reservationSuccessUrl,
                cancel_url: `${appUrl}/${locale}/dashboard/payments/cancel`,
                back_url: `${appUrl}/${locale}/dashboard/payments/cancel`,
                return_url: reservationSuccessUrl,
                metadata: {
                    type: 'RESERVATION',
                    amenityId,
                    startTime,
                    endTime,
                    notes,
                    userId: session.user.id,
                    totalAmount
                }
            }, recurrenteKeys);

            const url = checkoutSession.checkout_url || checkoutSession.url;
            return apiOk({ url });
        }

        // 2. Handle Existing Invoice Payment
        if (!invoiceId) {
            return apiError(
                { code: "MISSING_FIELDS", message: "ID de factura o datos de reserva requeridos" },
                400
            );
        }

        const invoice = await (prisma as any).invoice.findUnique({
            where: { id: invoiceId },
            include: { unit: { include: { complex: true } } }
        });

        if (!invoice) {
            return apiError({ code: "NOT_FOUND", message: "Factura no encontrada" }, 404);
        }

        if (invoice.category === InvoiceCategory.PLATFORM_SUBSCRIPTION) {
            return apiError(
                {
                    code: "INVALID_INVOICE",
                    message: "Las facturas de suscripción a la plataforma no se pagan desde esta pantalla.",
                },
                400
            );
        }

        if (!invoice.unit) {
            return apiError(
                { code: "INVALID_INVOICE", message: "Esta factura no tiene unidad asociada y no puede cobrarse aquí." },
                400
            );
        }

        if (invoice.status !== "PENDING" && invoice.status !== "PROCESSING" && invoice.status !== "OVERDUE") {
            return apiError(
                { code: "INVALID_INVOICE_STATUS", message: "Esta factura ya no está pendiente de pago" },
                400
            );
        }

        if (
            !method ||
            (method !== "CARD" && method !== "CASH" && method !== "TRANSFER")
        ) {
            return apiError(
                { code: "INVALID_METHOD", message: "Método de pago requerido" },
                400
            );
        }

        if (!invoice.paymentMethodIntent) {
            return apiError(
                {
                    code: "PAYMENT_INTENT_REQUIRED",
                    message: "El residente debe elegir un método de pago antes de continuar",
                },
                400
            );
        }

        if (method !== invoice.paymentMethodIntent) {
            return apiError(
                {
                    code: "PAYMENT_INTENT_MISMATCH",
                    message: "El método no coincide con el elegido para esta factura",
                },
                400
            );
        }

        // RBAC: Only the resident of the unit or an admin can pay
        if (session.user.role === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id }
            });
            if (!resident || resident.unitId !== invoice.unitId) {
                return apiError(
                    { code: "FORBIDDEN", message: "No tienes permiso para pagar esta factura" },
                    403
                );
            }
        } else if (session.user.role === Role.BOARD_OF_DIRECTORS) {
            const boardUser = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true },
            });
            if (!boardUser?.complexId || boardUser.complexId !== invoice.unit.complexId) {
                return apiError(
                    { code: "FORBIDDEN", message: "No tienes permiso para pagar esta factura" },
                    403
                );
            }
        } else if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN) {
            return apiError({ code: "FORBIDDEN", message: "No autorizado" }, 403);
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const locale = request.headers.get("referer")?.includes("/en/") ? "en" : "es";

        if (method === "CARD") {
            const recurrenteKeys = (invoice.unit.complex.settings as any)?.recurrente;

            const invoiceSuccessUrl = `${appUrl}/${locale}/dashboard/payments/success?session_id={CHECKOUT_SESSION_ID}&invoiceId=${encodeURIComponent(invoice.id)}&complexId=${encodeURIComponent(invoice.unit.complexId)}`;
            // Recurrente Checkout Creation
            const checkoutSession = await recurrente.checkouts.create({
                items: [{
                    name: `Factura ${invoice.number} - Periodo: ${invoice.month}/${invoice.year} - Unidad: ${invoice.unit.number}`,
                    currency: 'GTQ',
                    amount_in_cents: Math.round(Number(invoice.totalAmount) * 100),
                    quantity: 1,
                }],
                success_url: invoiceSuccessUrl,
                cancel_url: `${appUrl}/${locale}/dashboard/payments/cancel`,
                back_url: `${appUrl}/${locale}/dashboard/payments/cancel`,
                /** Tras 3DS debe volver a la app para consultar el checkout con las claves del complejo. */
                return_url: invoiceSuccessUrl,
                metadata: {
                    type: 'INVOICE',
                    invoiceId: invoice.id,
                    unitId: invoice.unitId,
                }
            }, recurrenteKeys);

            // Update invoice with intended payment method
            await (prisma as any).invoice.update({
                where: { id: invoice.id },
                data: { paymentMethod: 'CARD' }
            });

            const url = checkoutSession.checkout_url || checkoutSession.url;
            return apiOk({ url });
        } else {
            // CASH or TRANSFER
            await (prisma as any).invoice.update({
                where: { id: invoice.id },
                data: {
                    status: "PROCESSING",
                    paymentMethod: method
                }
            });

            return apiOk({ status: "PROCESSING" });
        }

    } catch (error: unknown) {
        console.error("Error creating Recurrente checkout session:", error);
        return apiError({ code: "INTERNAL_ERROR", message: "Error al procesar el pago" }, 500);
    }
}

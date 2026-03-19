import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { recurrente } from "@/lib/recurrente";
import { apiError, apiOk } from "@/lib/api-response";
import { notifyInvoicePaidToUnitResidents } from "@/lib/notifications";

function pickString(values: unknown[]): string | null {
    for (const value of values) {
        if (typeof value === "string" && value.length > 0) return value;
    }
    return null;
}

function extractInvoiceId(payload: Record<string, unknown>): string | null {
    const data = payload.data as Record<string, unknown> | undefined;
    const object = data?.object as Record<string, unknown> | undefined;
    const checkout = payload.checkout as Record<string, unknown> | undefined;
    const dataMetadata = data?.metadata as Record<string, unknown> | undefined;
    const metadata = payload.metadata as Record<string, unknown> | undefined;
    const checkoutMetadata = checkout?.metadata as Record<string, unknown> | undefined;

    const candidates = [
        (object?.metadata as Record<string, unknown> | undefined)?.invoiceId,
        metadata?.invoiceId,
        checkoutMetadata?.invoiceId,
        dataMetadata?.invoiceId,
    ];
    return pickString(candidates);
}

function isSuccessfulPaymentEvent(payload: Record<string, unknown>): boolean {
    const data = payload.data as Record<string, unknown> | undefined;
    const object = data?.object as Record<string, unknown> | undefined;
    const eventType = pickString([payload.type, payload.event_type]);
    const status = pickString([payload.status, payload.payment_status, object?.status]);
    return (
        eventType === "checkout.payment.succeeded" ||
        eventType === "payment.succeeded" ||
        eventType === "checkout_payment_succeeded" ||
        status === "paid" ||
        status === "completed" ||
        status === "succeeded"
    );
}

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        let body: Record<string, unknown>;
        try {
            body = JSON.parse(rawBody) as Record<string, unknown>;
        } catch {
            return apiError(
                { code: "INVALID_PAYLOAD", message: "Webhook payload inválido" },
                400
            );
        }

        const headersList = await headers();
        const signature = headersList.get("x-signature") || headersList.get("recurrente-signature");
        const timestamp = headersList.get("x-timestamp") || headersList.get("recurrente-timestamp");

        const isSignatureValid = recurrente.webhooks.verifySignature({
            rawBody,
            signatureHeader: signature,
            timestampHeader: timestamp,
        });

        if (!isSignatureValid) {
            return apiError(
                { code: "INVALID_SIGNATURE", message: "Firma de webhook inválida" },
                401
            );
        }

        if (!isSuccessfulPaymentEvent(body)) {
            return apiOk({ received: true, processed: false, reason: "event_ignored" });
        }

        const invoiceId = extractInvoiceId(body);
        if (!invoiceId) {
            return apiOk({ received: true, processed: false, reason: "missing_invoice_id" });
        }

        const paidUpdate = await prisma.invoice.updateMany({
            where: {
                id: invoiceId,
                status: { not: "PAID" },
            },
            data: {
                status: "PAID",
                paymentMethod: "CARD",
                updatedAt: new Date(),
            },
        });

        const linkedReservation = await prisma.reservation.findUnique({
            where: { invoiceId },
            select: { id: true, status: true },
        });

        if (linkedReservation && linkedReservation.status !== "APPROVED") {
            await prisma.reservation.update({
                where: { id: linkedReservation.id },
                data: { status: "APPROVED" },
            });
        }

        if (paidUpdate.count > 0) {
            await notifyInvoicePaidToUnitResidents(invoiceId);
        }

        return apiOk({ received: true, processed: true, invoiceId });

    } catch (err: unknown) {
        console.error("[PAYMENTS_WEBHOOK]", err);
        return apiError(
            { code: "WEBHOOK_ERROR", message: err instanceof Error ? err.message : "Error en webhook" },
            400
        );
    }
}

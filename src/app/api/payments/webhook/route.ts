import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { recurrente } from "@/lib/recurrente";

export async function POST(request: Request) {
    try {
        const body = await request.json(); // Recurrente sends JSON
        const headersList = await headers();
        // Check for Recurrente signature header - verify field name
        const signature = headersList.get('x-signature') || headersList.get('recurrente-signature'); // Adjust based on actual docs if found

        // Use a configured secret for webhooks if available, otherwise rely on payload validation
        // const endpointSecret = process.env.RECURRENTE_WEBHOOK_SECRET; 

        // For now, we log the event to understand its structure during first run
        console.log("Recurrente Webhook received:", JSON.stringify(body, null, 2));

        const eventType = body.type; // Assuming standard 'type' field

        // Map Recurrente event types. Example: 'checkout.succeeded' or similar
        // Based on common patterns: 'payment_intent.succeeded', 'checkout.session.completed'
        // If exact type is unknown, we look for status in the payload object

        let invoiceId = body.data?.object?.metadata?.invoiceId || body.metadata?.invoiceId;

        // Fallback: Check if we can find invoice ID in other standard fields or if structure differs
        if (!invoiceId && body.checkout && body.checkout.metadata) {
            invoiceId = body.checkout.metadata.invoiceId;
        }

        // Handle success event
        // We accept multiple success indicators since documentation is sparse
        if (eventType === 'checkout.payment.succeeded' ||
            eventType === 'payment.succeeded' ||
            body.event_type === 'checkout_payment_succeeded' || // Alternative format
            (body.status === 'paid' && invoiceId) // Direct object status check
        ) {

            if (invoiceId) {
                try {
                    await (prisma as any).invoice.update({
                        where: { id: invoiceId },
                        data: {
                            status: "PAID",
                            updatedAt: new Date(),
                        }
                    });

                    // Update linked reservation if exists
                    const linkedReservation = await (prisma as any).reservation.findUnique({
                        where: { invoiceId }
                    });

                    if (linkedReservation) {
                        await (prisma as any).reservation.update({
                            where: { id: linkedReservation.id },
                            data: { status: 'APPROVED' }
                        });
                        console.log(`Reservation ${linkedReservation.id} approved via Recurrente webhook`);
                    }

                    console.log(`Invoice ${invoiceId} marked as PAID via Recurrente webhook`);
                } catch (error) {
                    console.error(`Error updating invoice ${invoiceId}:`, error);
                    return NextResponse.json({ error: "Error updating invoice" }, { status: 500 });
                }
            } else {
                console.warn("Webhook received but no invoiceId found in metadata");
            }
        }

        return NextResponse.json({ received: true });

    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }
}

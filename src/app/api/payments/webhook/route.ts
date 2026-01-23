import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    let event;

    try {
        if (!sig || !endpointSecret) {
            throw new Error("Missing stripe-signature or webhook secret");
        }
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const invoiceId = session.metadata?.invoiceId;

            if (invoiceId) {
                try {
                    await (prisma as any).invoice.update({
                        where: { id: invoiceId },
                        data: {
                            status: "PAID",
                            updatedAt: new Date(),
                        }
                    });
                    console.log(`Invoice ${invoiceId} marked as PAID via webhook`);
                } catch (error) {
                    console.error(`Error updating invoice ${invoiceId}:`, error);
                    return NextResponse.json({ error: "Error updating invoice" }, { status: 500 });
                }
            }
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

// Next.js config for raw body (needed for Stripe)
export const config = {
    api: {
        bodyParser: false,
    },
};

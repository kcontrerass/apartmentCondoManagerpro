import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This endpoint is designed to be called by a CRON job (e.g., daily)
// It checks for active optional services that need to be billed for the current month
export async function GET(request: Request) {
    try {
        // Security: In production, verify a CRON secret header here.
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { return new Response('Unauthorized', { status: 401 }); }

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const currentDay = now.getDate();

        // 1. Find all active OPTIONAL unit services
        const optionalServices = await prisma.unitService.findMany({
            where: {
                status: "ACTIVE",
                service: {
                    isRequired: false
                }
            },
            include: {
                service: true,
                unit: true
            }
        });

        let processedCount = 0;
        let skippedCount = 0;
        let errorsCount = 0;

        for (const us of optionalServices) {
            // Check if service startDate matches today's day (or if it's the last day of month handling?)
            // For simplicity/robustness: We bill if we are IN the correct month and haven't billed yet.
            // Constraint: "de la fecha donde se inicio".

            const startDay = us.startDate.getDate();

            // Logic:
            // 1. Is the current day >= startDay? (Meaning the billing cycle for this month has started)
            // 2. Or is it the last day of the month and startDay > lastDay? (Handling Feb 28 vs Start Jan 30)

            const lastDayOfCurrentMonth = new Date(currentYear, currentMonth, 0).getDate();
            const billingDay = Math.min(startDay, lastDayOfCurrentMonth);

            // If today is before the billing day, we wait.
            if (currentDay < billingDay) {
                // Not yet time to bill for this month
                continue;
            }

            // Check if already invoiced for this month/year
            // We need to check checks based on serviceId + month + year
            const existingInvoiceItem = await prisma.invoiceItem.findFirst({
                where: {
                    serviceId: us.serviceId,
                    invoice: {
                        unitId: us.unitId,
                        month: currentMonth,
                        year: currentYear,
                        status: { not: "CANCELLED" }
                    }
                }
            });

            if (existingInvoiceItem) {
                skippedCount++;
                continue;
            }

            // GENERATE INVOICE
            try {
                // Calculate Due Date: End of current month
                const dueDate = new Date(currentYear, currentMonth, 0);

                const price = us.customPrice ? Number(us.customPrice) : Number(us.service.basePrice);
                const quantity = us.quantity || 1;
                const total = price * quantity;

                const invoiceNumber = `INV-${currentYear}${currentMonth.toString().padStart(2, '0')}-${us.unit.number.replace(/\s+/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

                await prisma.invoice.create({
                    data: {
                        number: invoiceNumber,
                        month: currentMonth,
                        year: currentYear,
                        dueDate: dueDate,
                        totalAmount: total,
                        status: "PENDING",
                        unitId: us.unitId,
                        complexId: us.unit.complexId,
                        createdAt: now,
                        items: {
                            create: [{
                                description: quantity > 1 ? `${us.service.name} (x${quantity}) [Renovación]` : `${us.service.name} [Renovación]`,
                                amount: total,
                                serviceId: us.serviceId
                            }]
                        }
                    }
                });

                processedCount++;
                console.log(`[AutoBilling] Generated invoice for ${us.service.name} - Unit ${us.unit.number}`);

            } catch (err) {
                console.error(`[AutoBilling] Error billing ${us.id}:`, err);
                errorsCount++;
            }
        }

        return NextResponse.json({
            status: "success",
            processed: processedCount,
            skipped: skippedCount,
            errors: errorsCount
        });

    } catch (error: any) {
        console.error("Cron billing error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

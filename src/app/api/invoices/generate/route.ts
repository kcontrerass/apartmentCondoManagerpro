import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { generateInvoicesSchema } from "@/lib/validations/invoice";
import { Role } from "@prisma/client";

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = generateInvoicesSchema.parse(body);

        // RBAC check: Only SUPER_ADMIN or ADMIN of the complex
        if (session.user.role === Role.ADMIN) {
            const complex = await prisma.complex.findUnique({
                where: { id: validatedData.complexId },
                select: { adminId: true },
            });

            if (!complex || complex.adminId !== session.user.id) {
                return NextResponse.json(
                    { error: "No tiene permiso sobre este complejo" },
                    { status: 403 }
                );
            }
        } else if (session.user.role !== Role.SUPER_ADMIN) {
            return NextResponse.json(
                { error: "Permisos insuficientes" },
                { status: 403 }
            );
        }

        const { complexId, month, year, dueDate } = validatedData;

        // 1. Get all units for the complex with their active services and existing invoices for the period
        const units = await prisma.unit.findMany({
            where: { complexId },
            include: {
                services: {
                    where: { status: "ACTIVE" },
                    include: { service: true }
                },
                invoices: {
                    where: {
                        month,
                        year,
                        status: { not: "CANCELLED" }
                    },
                    include: {
                        items: true
                    }
                }
            } as any
        });

        if (units.length === 0) {
            return NextResponse.json(
                { error: "El complejo no tiene unidades registradas" },
                { status: 400 }
            );
        }

        let generatedCount = 0;
        let skippedCount = 0;

        // 2. Process each unit in a transaction
        await (prisma as any).$transaction(async (tx: any) => {
            for (const unit of units as any[]) {
                // Get all service IDs that have already been invoiced this month for this unit
                const invoicedServiceIds = new Set(
                    unit.invoices.flatMap((inv: any) =>
                        inv.items.map((item: any) => item.serviceId)
                    ).filter(Boolean)
                );

                // Identify services that haven't been invoiced yet
                const servicesToInvoice = unit.services.filter((us: any) => !invoicedServiceIds.has(us.serviceId));

                if (servicesToInvoice.length === 0) {
                    skippedCount++;
                    continue;
                }

                // Split into mandatory and optional
                const mandatoryServices = servicesToInvoice.filter((us: any) => us.service.isRequired);
                const optionalServices = servicesToInvoice.filter((us: any) => !us.service.isRequired);

                // Helper to create an invoice
                const createInvoice = async (itemsData: any[]) => {
                    let total = 0;
                    const items = itemsData.map((us: any) => {
                        const price = us.customPrice ? Number(us.customPrice) : Number(us.service.basePrice);
                        const quantity = us.quantity || 1;
                        const lineTotal = price * quantity;
                        total += lineTotal;
                        return {
                            description: quantity > 1 ? `${us.service.name} (x${quantity})` : us.service.name,
                            amount: lineTotal,
                            serviceId: us.serviceId
                        };
                    });

                    const invoiceNumber = `INV-${year}${month.toString().padStart(2, '0')}-${unit.number.replace(/\s+/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

                    await tx.invoice.create({
                        data: {
                            number: invoiceNumber,
                            month,
                            year,
                            dueDate: new Date(year, month, 0), // Force due date to last day of billing month
                            totalAmount: total,
                            status: "PENDING",
                            unitId: unit.id,
                            complexId,
                            items: {
                                create: items
                            }
                        }
                    });
                    generatedCount++;
                };

                // Create grouped invoice for mandatory services
                if (mandatoryServices.length > 0) {
                    await createInvoice(mandatoryServices);
                }

                // Create separate invoices for each optional service
                for (const us of optionalServices) {
                    await createInvoice([us]);
                }
            }
        });

        return NextResponse.json({
            message: `Generación completada`,
            generated: generatedCount,
            skipped: skippedCount
        });

    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error generating invoices:", error);
        return NextResponse.json(
            { error: error.message || "Error al generar facturas" },
            { status: 500 }
        );
    }
}

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

        // 1. Get all units for the complex
        const units = await prisma.unit.findMany({
            where: { complexId },
            include: {
                services: {
                    where: { status: "ACTIVE" },
                    include: { service: true }
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
                // Check if invoice already exists for this unit/month/year
                const existingInvoice = await tx.invoice.findFirst({
                    where: {
                        unitId: unit.id,
                        month,
                        year,
                        status: { not: "CANCELLED" }
                    }
                });

                if (existingInvoice) {
                    skippedCount++;
                    continue;
                }

                // Skip units without active services
                if (!unit.services || unit.services.length === 0) {
                    skippedCount++;
                    continue;
                }

                // Calculate total and items
                let total = 0;
                const items = unit.services.map((us: any) => {
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
                        dueDate,
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

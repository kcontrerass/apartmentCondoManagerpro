import { prisma } from "@/lib/db";

interface GenerationResult {
    generatedCount: number;
    skippedCount: number;
}

export async function generateInvoicesForComplex(
    tx: any,
    complexId: string,
    month: number,
    year: number,
    unitId?: string // Optional unitId to generate for a specific unit
): Promise<GenerationResult> {
    // 1. Get units for the complex with their active services and existing invoices for the period
    const units = await tx.unit.findMany({
        where: {
            complexId,
            ...(unitId ? { id: unitId } : {})
        },
        include: {
            residents: {
                orderBy: { startDate: 'desc' }
            },
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
        }
    });

    let generatedCount = 0;
    let skippedCount = 0;

    const lastDayOfMonth = new Date(year, month, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    for (const unit of units) {
        // Find the resident that started in this billing month, or the most recent one
        const resident = unit.residents.find((r: any) => {
            const d = new Date(r.startDate);
            return d.getFullYear() === year && (d.getMonth() + 1) === month;
        }) || (unit.residents && unit.residents.length > 0 ? unit.residents[0] : null);

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
        const createOneInvoice = async (itemsData: any[]) => {
            let total = 0;
            const items = [];

            for (const us of itemsData) {
                // Cálculo de ratio de prorrateo individual
                let itemProrataRatio = 1;

                // Regla de Cobro: El residente paga desde el momento en que se cumple:
                // 1. Está en la unidad (resident.startDate)
                // 2. El servicio está activo (us.startDate)
                // Usamos la fecha más reciente de ambas si ambas ocurren en el mes de facturación.

                let effectiveStartDate = us.startDate ? new Date(us.startDate) : null;
                if (resident?.startDate) {
                    const residentStart = new Date(resident.startDate);
                    if (!effectiveStartDate || residentStart > effectiveStartDate) {
                        effectiveStartDate = residentStart;
                    }
                }

                if (effectiveStartDate) {
                    if (effectiveStartDate.getFullYear() === year && (effectiveStartDate.getMonth() + 1) === month) {
                        const activeDays = daysInMonth - effectiveStartDate.getDate() + 1;
                        if (activeDays < daysInMonth && activeDays > 0) {
                            itemProrataRatio = activeDays / daysInMonth;
                        } else if (activeDays <= 0) {
                            continue;
                        }
                    } else if (effectiveStartDate > lastDayOfMonth) {
                        continue;
                    }
                }

                const basePrice = us.customPrice ? Number(us.customPrice) : Number(us.service.basePrice);
                const price = itemProrataRatio < 1 ? Number((basePrice * itemProrataRatio).toFixed(2)) : basePrice;
                const quantity = us.quantity || 1;
                const lineTotal = price * quantity;
                total += lineTotal;

                let description = quantity > 1 ? `${us.service.name} (x${quantity})` : us.service.name;
                if (itemProrataRatio < 1) {
                    description += ` (Prorrateo: ${Math.round(itemProrataRatio * 100)}%)`;
                }

                items.push({
                    description,
                    amount: lineTotal,
                    serviceId: us.serviceId
                });
            }

            if (items.length === 0) return;

            const invoiceNumber = `INV-${year}${month.toString().padStart(2, '0')}-${unit.number.replace(/\s+/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

            await tx.invoice.create({
                data: {
                    number: invoiceNumber,
                    month,
                    year,
                    dueDate: new Date(year, month, 0),
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
            await createOneInvoice(mandatoryServices);
        }

        // Create separate invoices for each optional service
        for (const us of optionalServices) {
            await createOneInvoice([us]);
        }
    }

    return { generatedCount, skippedCount };
}

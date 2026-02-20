import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { serviceSchema } from "@/lib/validations/service";
import { Role } from "@/types/roles";
import { generateInvoicesForComplex } from "@/lib/services/invoice-generation";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const complexId = searchParams.get("complexId");
        const isRequired = searchParams.get("isRequired");
        const search = searchParams.get("search") || "";

        let whereClause: any = {
            name: { contains: search },
        };

        if (complexId) {
            whereClause.complexId = complexId;
        }

        if (isRequired !== null) {
            whereClause.isRequired = isRequired === "true";
        }

        // Role check for ADMIN: Can only see services of their complex
        if (session.user.role === Role.ADMIN) {
            const complex = await prisma.complex.findFirst({
                where: { adminId: session.user.id },
            });

            if (!complex) {
                return NextResponse.json([]);
            }

            if (complexId && complexId !== complex.id) {
                return NextResponse.json({ error: "No tiene permiso para ver servicios de este complejo" }, { status: 403 });
            }

            whereClause.complexId = complex.id;
        } else if (session.user.role === Role.BOARD_OF_DIRECTORS || session.user.role === Role.GUARD) {
            const user = await (prisma as any).user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true }
            });

            if (!user?.complexId) {
                return NextResponse.json([]);
            }

            if (complexId && complexId !== user.complexId) {
                return NextResponse.json({ error: "No tiene permiso para ver servicios de este complejo" }, { status: 403 });
            }

            whereClause.complexId = user.complexId;
        } else if (session.user.role === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id },
                select: { unit: { select: { complexId: true, id: true } } }
            });

            if (!resident?.unit) {
                return NextResponse.json([]);
            }

            whereClause.complexId = resident.unit.complexId;
        }

        const services = await prisma.service.findMany({
            where: whereClause,
            include: {
                complex: {
                    select: {
                        name: true,
                    },
                },
                _count: {
                    select: {
                        unitServices: true,
                    },
                },
                unitServices: session.user.role === Role.RESIDENT ? {
                    where: {
                        unit: {
                            residents: {
                                some: {
                                    userId: session.user.id
                                }
                            }
                        }
                    },
                    select: {
                        id: true,
                        status: true,
                        quantity: true,
                        startDate: true
                    }
                } : false,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(services);
    } catch (error) {
        console.error("Error fetching services:", error);
        return NextResponse.json(
            { error: "Error al obtener los servicios" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = serviceSchema.parse(body);

        // RBAC: Only SUPER_ADMIN or the ADMIN of the specific complex can create services
        if (session.user.role === Role.ADMIN) {
            const complex = await prisma.complex.findUnique({
                where: { id: validatedData.complexId },
                select: { adminId: true },
            });

            if (!complex || complex.adminId !== session.user.id) {
                return NextResponse.json(
                    { error: "No tiene permiso para crear servicios en este complejo" },
                    { status: 403 }
                );
            }
        } else if (session.user.role !== Role.SUPER_ADMIN) {
            return NextResponse.json(
                { error: "Solo administradores pueden crear servicios" },
                { status: 403 }
            );
        }

        const service = await (prisma as any).$transaction(async (tx: any) => {
            // 1. Create the service
            const newService = await tx.service.create({
                data: {
                    name: validatedData.name,
                    description: validatedData.description,
                    basePrice: validatedData.basePrice,
                    frequency: validatedData.frequency,
                    complexId: validatedData.complexId,
                    isRequired: validatedData.isRequired,
                    hasQuantity: validatedData.hasQuantity,
                },
            });

            // 2. ONLY auto-assign to all units if it's a mandatory service
            if (validatedData.isRequired) {
                // Find all units in the complex
                const units = await tx.unit.findMany({
                    where: { complexId: validatedData.complexId },
                    select: { id: true },
                });

                // Create UnitService for each unit
                await tx.unitService.createMany({
                    data: units.map((unit) => ({
                        unitId: unit.id,
                        serviceId: newService.id,
                        customPrice: null, // Use service base price
                        status: "ACTIVE",
                        startDate: new Date(),
                    })),
                    skipDuplicates: true,
                });

                // 3. Auto-generate invoices if billing for this month has already started
                const now = new Date();
                const currentMonth = now.getMonth() + 1;
                const currentYear = now.getFullYear();

                const existingInvoices = await tx.invoice.findFirst({
                    where: {
                        complexId: validatedData.complexId,
                        month: currentMonth,
                        year: currentYear
                    }
                });

                if (existingInvoices) {
                    console.log(`[MandatoryBilling] Billing cycle started. Triggering generation for all units.`);
                    await generateInvoicesForComplex(tx, validatedData.complexId, currentMonth, currentYear);
                }
            }

            return newService;
        }, {
            timeout: 30000 // 30 seconds for bulk mandatory assignment
        });

        return NextResponse.json(service, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error creating service:", error);
        return NextResponse.json(
            { error: "Error al crear el servicio" },
            { status: 500 }
        );
    }
}

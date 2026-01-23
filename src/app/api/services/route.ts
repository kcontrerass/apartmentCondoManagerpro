import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { serviceSchema } from "@/lib/validations/service";
import { Role } from "@prisma/client";

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

        const service = await prisma.$transaction(async (tx) => {
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
            }

            return newService;
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

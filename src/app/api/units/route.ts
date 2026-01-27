import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { unitSchema } from "@/lib/validations/unit";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";

        let whereClause: any = {
            OR: [
                { number: { contains: search } },
                { complex: { name: { contains: search } } },
            ],
        };

        if (session.user.role === Role.ADMIN) {
            const complex = await prisma.complex.findFirst({
                where: { adminId: session.user.id }
            });

            if (!complex) return NextResponse.json([]);

            whereClause = {
                AND: [whereClause, { complexId: complex.id }]
            };
        } else if (session.user.role === Role.OPERATOR || session.user.role === Role.GUARD) {
            const user = await (prisma as any).user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true }
            });

            if (!user?.complexId) return NextResponse.json([]);

            whereClause = {
                AND: [whereClause, { complexId: user.complexId }]
            };
        }

        const units = await prisma.unit.findMany({
            where: whereClause,
            include: {
                complex: {
                    select: { name: true },
                },
                residents: {
                    include: {
                        user: {
                            select: { name: true, email: true },
                        },
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });

        return NextResponse.json(units);
    } catch (error) {
        console.error("Error fetching all units:", error);
        return NextResponse.json(
            { error: "Error al obtener las unidades" },
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

        if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = unitSchema.parse(body);
        const { serviceIds, ...unitData } = validatedData;

        const complexIdToUse = body.complexId || unitData.complexId;
        if (!complexIdToUse) {
            return NextResponse.json({ error: "complexId es requerido" }, { status: 400 });
        }

        // Check for duplicate unit number in this complex
        const existingUnit = await prisma.unit.findUnique({
            where: {
                complexId_number: {
                    complexId: complexIdToUse,
                    number: validatedData.number,
                },
            },
        });

        if (existingUnit) {
            return NextResponse.json(
                { error: "Ya existe una unidad con ese número en este complejo" },
                { status: 400 }
            );
        }

        const unit = await prisma.$transaction(async (tx) => {
            const createdUnit = await tx.unit.create({
                data: {
                    number: unitData.number,
                    type: unitData.type,
                    bedrooms: unitData.bedrooms,
                    bathrooms: unitData.bathrooms,
                    area: unitData.area,
                    status: unitData.status,
                    complexId: complexIdToUse,
                },
            });

            // 1. Fetch mandatory services for this complex
            const mandatoryServicesList = await tx.service.findMany({
                where: {
                    complexId: complexIdToUse,
                    isRequired: true,
                },
                select: { id: true },
            });

            // 2. Combine and resolve quantities
            // Map: serviceId -> quantity
            const servicesToAssign = new Map<string, number>();

            // All mandatory services get quantity 1 (initial default)
            mandatoryServicesList.forEach((s) => servicesToAssign.set(s.id, 1));

            // services (from body) is an array of {id, quantity}
            const bodyServices = (body.services || []) as { id: string, quantity?: number }[];
            bodyServices.forEach((s) => {
                servicesToAssign.set(s.id, s.quantity || 1);
            });

            // serviceIds (legacy) can also be used
            const bodyServiceIds = (body.serviceIds || []) as string[];
            bodyServiceIds.forEach((id) => {
                if (!servicesToAssign.has(id)) {
                    servicesToAssign.set(id, 1);
                }
            });

            if (servicesToAssign.size > 0) {
                await tx.unitService.createMany({
                    data: Array.from(servicesToAssign.entries()).map(([serviceId, quantity]) => ({
                        unitId: createdUnit.id,
                        serviceId,
                        quantity,
                        status: "ACTIVE",
                        startDate: new Date(),
                    })),
                });
            }

            return createdUnit;
        });

        return NextResponse.json(unit, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Error al crear la unidad" },
            { status: 500 }
        );
    }
}

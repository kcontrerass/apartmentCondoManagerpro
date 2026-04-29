import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { unitSchema } from "@/lib/validations/unit";
import { createUnitWithServices } from "@/lib/units/create-unit-with-services";
import { Role } from "@/types/roles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const complexId = searchParams.get("complexId"); // For filtering by specific complex

        let whereClause: any = {
            OR: [
                { number: { contains: search } },
                { complex: { name: { contains: search } } },
            ],
        };

        // If complexId is provided in query, filter by it (for RESIDENT search)
        if (complexId) {
            whereClause = {
                AND: [whereClause, { complexId: complexId }]
            };
        } else if (session.user.role === Role.ADMIN) {
            const complex = await prisma.complex.findFirst({
                where: { adminId: session.user.id }
            });

            if (!complex) return NextResponse.json([]);

            whereClause = {
                AND: [whereClause, { complexId: complex.id }]
            };
        } else if (session.user.role === Role.BOARD_OF_DIRECTORS || session.user.role === Role.GUARD) {
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
                    select: { name: true, type: true },
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

        if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN && session.user.role !== Role.BOARD_OF_DIRECTORS) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = unitSchema.parse(body);
        const { serviceIds, ...unitData } = validatedData;

        const complexIdToUse = body.complexId || unitData.complexId;
        if (!complexIdToUse) {
            return NextResponse.json({ error: "complexId es requerido" }, { status: 400 });
        }

        // RBAC: Verify user has permission to manage units in this complex
        if (session.user.role === Role.ADMIN) {
            const complex = await prisma.complex.findFirst({
                where: { id: complexIdToUse, adminId: session.user.id }
            });
            if (!complex) {
                return NextResponse.json({ error: "No tienes permisos para gestionar unidades en este complejo" }, { status: 403 });
            }
        } else if (session.user.role === Role.BOARD_OF_DIRECTORS) {
            const user = await (prisma as any).user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true }
            });
            if (user?.complexId !== complexIdToUse) {
                return NextResponse.json({ error: "No tienes permisos para gestionar unidades en este complejo" }, { status: 403 });
            }
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

        const unit = await prisma.$transaction(async (tx) =>
            createUnitWithServices(
                tx,
                complexIdToUse,
                {
                    number: unitData.number,
                    type: unitData.type,
                    bedrooms: unitData.bedrooms,
                    bathrooms: unitData.bathrooms,
                    parkingSpots: unitData.parkingSpots,
                    area: unitData.area,
                    status: unitData.status,
                },
                body
            )
        );

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

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { unitSchema } from "@/lib/validations/unit";
import { createUnitWithServices } from "@/lib/units/create-unit-with-services";
import { Role } from "@/types/roles";

export const dynamic = "force-dynamic";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const units = await prisma.unit.findMany({
            where: {
                complexId: id,
            },
            include: {
                complex: {
                    select: { name: true }
                },
                residents: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                number: "asc",
            },
        });

        return NextResponse.json(units);
    } catch (error) {
        console.error("Error fetching units:", error);
        return NextResponse.json(
            { error: "Error al obtener las unidades" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Role check: SUPER_ADMIN, ADMIN, and BOARD_OF_DIRECTORS can create units
        if (
            session.user.role !== Role.SUPER_ADMIN &&
            session.user.role !== Role.ADMIN &&
            session.user.role !== Role.BOARD_OF_DIRECTORS
        ) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        if (session.user.role === Role.ADMIN) {
            const complex = await prisma.complex.findFirst({
                where: { id, adminId: session.user.id }
            });
            if (!complex) {
                return NextResponse.json({ error: "No tienes permisos en este complejo" }, { status: 403 });
            }
        } else if (session.user.role === Role.BOARD_OF_DIRECTORS) {
            const user = await (prisma as any).user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true }
            });
            if (user?.complexId !== id) {
                return NextResponse.json({ error: "No tienes permisos en este complejo" }, { status: 403 });
            }
        }

        const body = await request.json();
        const validatedData = unitSchema.parse(body);

        // Check for duplicate unit number in this complex
        const existingUnit = await prisma.unit.findUnique({
            where: {
                complexId_number: {
                    complexId: id,
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

        const { services, serviceIds, ...unitData } = validatedData;

        const unit = await prisma.$transaction(async (tx) =>
            createUnitWithServices(
                tx,
                id,
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
        console.error("Error creating unit:", error);
        return NextResponse.json(
            { error: "Error al crear la unidad" },
            { status: 500 }
        );
    }
}

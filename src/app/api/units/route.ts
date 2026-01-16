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

            if (!complex) {
                // Admin assigned to no complex sees nothing
                return NextResponse.json([]);
            }

            whereClause = {
                AND: [
                    whereClause,
                    { complexId: complex.id }
                ]
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

        const { complexId } = body;
        if (!complexId) {
            return NextResponse.json({ error: "complexId es requerido" }, { status: 400 });
        }

        // Check for duplicate unit number in this complex
        const existingUnit = await prisma.unit.findUnique({
            where: {
                complexId_number: {
                    complexId,
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

        const unit = await prisma.unit.create({
            data: {
                ...validatedData,
                complexId,
            },
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

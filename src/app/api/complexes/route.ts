import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { ComplexCreateSchema } from "@/lib/validations/complex";
import { Role } from "@prisma/client";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const type = searchParams.get("type");

        const complexes = await prisma.complex.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { name: { contains: search } },
                            { address: { contains: search } },
                        ],
                    },
                    type ? { type: type as any } : {},
                ],
            },
            include: {
                _count: {
                    select: {
                        units: true,
                        amenities: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(complexes);
    } catch (error) {
        console.error("Error fetching complexes:", error);
        return NextResponse.json(
            { error: "Error al obtener los complejos" },
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

        // Role check: Only SUPER_ADMIN and ADMIN can create complexes
        if (session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.ADMIN) {
            return NextResponse.json({ error: "Permisos insuficientes" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = ComplexCreateSchema.parse(body);

        const complex = await prisma.complex.create({
            data: {
                name: validatedData.name,
                address: validatedData.address,
                type: validatedData.type,
                logoUrl: validatedData.logoUrl,
                settings: validatedData.settings || {},
                adminId: validatedData.adminId || session.user.id,
            },
        });

        return NextResponse.json(complex, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error creating complex:", error);
        return NextResponse.json(
            { error: "Error al crear el complejo" },
            { status: 500 }
        );
    }
}

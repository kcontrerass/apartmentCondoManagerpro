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

        let whereClause: any = {
            AND: [
                {
                    OR: [
                        { name: { contains: search } },
                        { address: { contains: search } },
                    ],
                },
                type ? { type: type as any } : {},
            ],
        };

        if (session.user.role === Role.ADMIN) {
            const adminComplex = await prisma.complex.findFirst({
                where: { adminId: session.user.id }
            });

            if (!adminComplex) {
                return NextResponse.json([]);
            }

            whereClause.AND.push({ id: adminComplex.id });
        } else if (session.user.role === Role.OPERATOR || session.user.role === Role.GUARD) {
            const user = await (prisma as any).user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true }
            });

            if (!user?.complexId) {
                return NextResponse.json([]);
            }

            whereClause.AND.push({ id: user.complexId });
        }

        const complexes = await prisma.complex.findMany({
            where: whereClause,
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

        // Role check: Only SUPER_ADMIN can create complexes
        if (session.user.role !== Role.SUPER_ADMIN) {
            return NextResponse.json({ error: "Solo el Super Administrador puede crear complejos" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = ComplexCreateSchema.parse(body);

        let adminIdToAssign = validatedData.adminId;


        const complex = await prisma.complex.create({
            data: {
                name: validatedData.name,
                address: validatedData.address,
                type: validatedData.type,
                logoUrl: validatedData.logoUrl,
                settings: validatedData.settings || {},
                adminId: adminIdToAssign,
            },
        });

        return NextResponse.json(complex, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        // Prisma unique constraint violation
        if (error.code === 'P2002' && error.meta?.target?.includes('adminId')) {
            return NextResponse.json(
                { error: "El administrador seleccionado ya está asignado a otro complejo. Un administrador solo puede gestionar un complejo." },
                { status: 409 }
            );
        }
        console.error("Error creating complex:", error);
        return NextResponse.json(
            { error: "Error al crear el complejo" },
            { status: 500 }
        );
    }
}

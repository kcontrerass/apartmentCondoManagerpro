import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { residentSchema } from "@/lib/validations/resident";
import { Role } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unitId = searchParams.get("unitId");
        let complexId = searchParams.get("complexId");

        if (session.user.role === Role.ADMIN) {
            const adminComplex = await prisma.complex.findFirst({
                where: { adminId: session.user.id }
            });
            if (!adminComplex) {
                return NextResponse.json([]);
            }
            complexId = adminComplex.id;
        } else if (session.user.role === Role.OPERATOR || session.user.role === Role.GUARD) {
            const user = await (prisma as any).user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true }
            });
            if (!user?.complexId) {
                return NextResponse.json([]);
            }
            complexId = user.complexId;
        }

        const residents = await prisma.resident.findMany({
            where: {
                AND: [
                    unitId ? { unitId } : {},
                    complexId ? { unit: { complexId } } : {},
                ],
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                unit: {
                    include: {
                        complex: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(residents);
    } catch (error) {
        console.error("Error fetching residents:", error);
        return NextResponse.json(
            { error: "Error al obtener los residentes" },
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
        const validatedData = residentSchema.parse(body);

        // Verify user exists
        const userExists = await prisma.user.findUnique({
            where: { id: validatedData.userId }
        });
        if (!userExists) {
            return NextResponse.json({ error: "El usuario especificado no existe" }, { status: 404 });
        }

        // Verify unit exists
        const unitExists = await prisma.unit.findUnique({
            where: { id: validatedData.unitId }
        });
        if (!unitExists) {
            return NextResponse.json({ error: "La unidad especificada no existe" }, { status: 404 });
        }

        // Check if user is already a resident
        const existingResident = await prisma.resident.findUnique({
            where: { userId: validatedData.userId }
        });
        if (existingResident) {
            return NextResponse.json({ error: "Este usuario ya está asignado como residente a una unidad" }, { status: 400 });
        }

        const resident = await prisma.resident.create({
            data: {
                type: validatedData.type,
                startDate: validatedData.startDate,
                endDate: validatedData.endDate,
                emergencyContact: (validatedData.emergencyContact as any) || {},
                userId: validatedData.userId,
                unitId: validatedData.unitId,
            },
        });

        // Update unit status to OCCUPIED
        await prisma.unit.update({
            where: { id: validatedData.unitId },
            data: { status: "OCCUPIED" }
        });

        return NextResponse.json(resident, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error creating resident:", error);
        return NextResponse.json(
            { error: "Error al crear el residente" },
            { status: 500 }
        );
    }
}

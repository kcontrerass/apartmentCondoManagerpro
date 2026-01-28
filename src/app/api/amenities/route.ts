import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createAmenitySchema } from "@/lib/validations/amenity";
import { Role } from "@prisma/client";

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const complexId = searchParams.get("complexId");

        const where: any = {};

        // RBAC:
        // Residents can ONLY see amenities of their own complex
        // Admins see by default their own complex's amenities
        // SUPER_ADMIN and OPERATOR can see everything or filter
        if (session.user.role === Role.RESIDENT) {
            const resident = await prisma.resident.findUnique({
                where: { userId: session.user.id },
                include: { unit: true }
            });

            if (!resident?.unit) {
                console.warn(`Resident user ${session.user.id} has no assigned unit/complex.`);
                return NextResponse.json([]); // Return empty list instead of error
            }

            where.complexId = resident.unit.complexId;
            console.log(`[API Amenities] Resident ${session.user.id} filtering by complex: ${where.complexId}`);
        } else if (session.user.role === Role.ADMIN) {
            if (complexId) {
                // Verify they own the requested complex
                const complex = await prisma.complex.findUnique({
                    where: { id: complexId }
                });
                if (complex?.adminId !== session.user.id) {
                    return NextResponse.json({ error: "No tienes permiso para ver amenidades de este complejo" }, { status: 403 });
                }
                where.complexId = complexId;
                console.log(`[API Amenities] Admin ${session.user.id} filtering by specific complex: ${where.complexId}`);
            } else {
                // Automatically filter by their managed complex
                where.complex = { adminId: session.user.id };
                console.log(`[API Amenities] Admin ${session.user.id} filtering by managed complexes`);
            }
        } else if (session.user.role === Role.OPERATOR || session.user.role === Role.GUARD) {
            const user = await (prisma as any).user.findUnique({
                where: { id: session.user.id },
                select: { complexId: true }
            });
            if (!user?.complexId) {
                return NextResponse.json([]);
            }
            where.complexId = user.complexId;
            console.log(`[API Amenities] Staff ${session.user.id} filtering by complex: ${where.complexId}`);
        } else if (complexId) {
            // Other roles (SUPER_ADMIN) filter by complex if provided
            where.complexId = complexId;
            console.log(`[API Amenities] Other role filtering by complex: ${where.complexId}`);
        }

        console.log("[API Amenities] Where clause:", JSON.stringify(where, null, 2));

        const amenities = await prisma.amenity.findMany({
            where,
            include: {
                complex: {
                    select: { name: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json(amenities);
    } catch (error) {
        console.error("Error fetching amenities:", error);
        return NextResponse.json(
            { error: "Error al obtener las amenidades" },
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

        // RBAC Check
        if (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN && session.user.role !== Role.OPERATOR) {
            return NextResponse.json({ error: "No tienes permiso para crear amenidades" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = createAmenitySchema.parse(body);

        // If ADMIN, check if they own the complex
        if (session.user.role === Role.ADMIN) {
            const complex = await prisma.complex.findUnique({
                where: { id: validatedData.complexId }
            });
            if (complex?.adminId !== session.user.id) {
                return NextResponse.json({ error: "No puedes crear amenidades en un complejo que no administras" }, { status: 403 });
            }
        }

        const amenity = await prisma.amenity.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                type: validatedData.type,
                requiresPayment: validatedData.requiresPayment,
                capacity: validatedData.capacity,
                operatingHours: validatedData.operatingHours ? {
                    ...validatedData.operatingHours,
                    days: validatedData.operatingHours.days || [0, 1, 2, 3, 4, 5, 6]
                } : undefined,
                costPerDay: validatedData.costPerDay,
                costPerHour: validatedData.costPerHour,
                complexId: validatedData.complexId
            }
        });

        return NextResponse.json(amenity, { status: 201 });
    } catch (error: any) {
        if (error.name === "ZodError") {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error creating amenity:", error);
        return NextResponse.json(
            { error: "Error al crear la amenidad" },
            { status: 500 }
        );
    }
}
